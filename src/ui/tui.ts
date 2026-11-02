import {
  BoxRenderable,
  type CliRenderer,
  createCliRenderer,
  InputRenderable,
  type KeyEvent,
  ScrollBoxRenderable,
  TextRenderable,
} from "@opentui/core";
import { planRemoval } from "../actions/planner";
import type { Finding } from "../domain/types";
import { keymap } from "./keymap";
import {
  jumpCursor,
  makeUiState,
  moveCursor,
  pageCursor,
  setError,
  setView,
  toggleSelection,
  type UiState,
  visibleFindings,
  windowedFindings,
} from "./model";

const palette = {
  bg: "#10141c",
  panel: "#171d28",
  border: "#334155",
  text: "#e5e7eb",
  muted: "#94a3b8",
  accent: "#67e8f9",
};

function row(f: Finding, selected: boolean, current: boolean): string {
  return `${current ? "▸" : " "} ${selected ? "[x]" : "[ ]"} ${f.risk.padEnd(8)} ${f.kind.padEnd(20)} ${f.path}`;
}

export function findingTableHeader(): string {
  return "   MARK     RISK     TYPE                 PATH";
}

function detail(state: UiState): string {
  const visible = visibleFindings(state);
  const f = visible[state.cursor];
  if (!f) return "No finding selected.\n\nPress / to search.";
  return [
    `FINDING ${state.cursor + 1} OF ${visible.length}`,
    "",
    `${f.selected ? "SELECTED FOR REVIEW" : "NOT SELECTED"}`,
    "",
    "WHAT THIS MEANS",
    f.explanation,
    "",
    "TECHNICAL DETAILS",
    `Path: ${f.path}`,
    `Kind: ${f.kind}`,
    `State: ${f.state}`,
    `Confidence: ${f.confidence}`,
    `Risk: ${f.risk}`,
    `Recommended action: ${f.action}`,
    `Size: ${f.sizeBytes ?? 0} bytes`,
    "",
    "WHY IT IS LISTED",
    ...f.evidence.map((e) => `• ${e.source} [${e.strength}] ${e.value}`),
    "",
    "Space select · y copy path · Esc back",
  ].join("\n");
}

function dryRun(state: UiState): string {
  const plan = planRemoval(state.findings, true);
  const preview = plan.items.slice(0, 40);
  const lines = [
    "PREVIEW — NOTHING WILL CHANGE",
    "",
    "This build is read-only; no cleanup has been performed.",
    `Selected items: ${plan.items.length}`,
  ];
  for (const item of preview)
    lines.push("", `${item.action}: ${item.source}`, `  → ${item.destination}`);
  if (plan.items.length > preview.length)
    lines.push(
      "",
      `… ${plan.items.length - preview.length} more action(s) omitted from preview.`,
    );
  if (plan.errors.length) lines.push("", `Rejected: ${plan.errors.join("; ")}`);
  lines.push("", "Press c to review this list once more.");
  return lines.join("\n");
}

function confirmation(state: UiState): string {
  const plan = planRemoval(state.findings, true);
  const preview = plan.items.slice(0, 40);
  return [
    "FINAL REVIEW",
    "",
    `You are reviewing ${plan.items.length} proposed action(s).`,
    "Nothing has been changed. Scan mode is read-only.",
    "",
    ...preview.map(
      (item) => `${item.action}: ${item.source}\n  → ${item.destination}`,
    ),
    ...(plan.items.length > preview.length
      ? [
          `… ${plan.items.length - preview.length} more action(s) omitted from preview.`,
        ]
      : []),
    "",
    "Press y to acknowledge this preview, or Esc to go back.",
  ].join("\n");
}

function help(): string {
  return [
    "KEYBOARD GUIDE",
    "",
    "j / ↓       move down",
    "k / ↑       move up",
    "g           jump to first finding",
    "G           jump to last finding",
    "Ctrl-d/u    move one page",
    "Space       select or deselect a finding",
    "/           focus search",
    "r           cycle risk filter",
    "Enter       open details",
    "y           copy the current path",
    "d           preview selected proposed actions",
    "c           open confirmation from preview",
    "q           quit",
    "Esc         return; quit from the main screen",
    "",
    "Protected, elevated, and uncertain findings are never selected automatically.",
    "Scan mode is read-only; dry-run and confirmation do not mutate files.",
    "",
    "Press Esc or Backspace to return.",
  ].join("\n");
}

function errorPanel(state: UiState): string {
  return [
    "SOMETHING WENT WRONG",
    "",
    "No files were deleted or changed.",
    "",
    `Error: ${state.error ?? "Unknown error"}`,
    "",
    "Press Esc to return to the findings. If this keeps happening, copy the",
    "technical error above and report it with the command and fixture used.",
  ].join("\n");
}

function refresh(
  renderer: CliRenderer,
  state: UiState,
  header: TextRenderable,
  stats: TextRenderable,
  listHeader: TextRenderable,
  list: ScrollBoxRenderable,
  listRows: TextRenderable[],
  details: ScrollBoxRenderable,
  detailText: TextRenderable,
  footer: TextRenderable,
  search: InputRenderable,
): void {
  const visible = visibleFindings(state);
  const window = windowedFindings(state);
  const current = visible[state.cursor];
  const showTable = state.view === "summary" || state.view === "detail";
  const mode =
    state.view === "summary"
      ? "REVIEW"
      : state.view === "history"
        ? "HELP"
        : state.view.toUpperCase();
  header.content = ` LEFTOVER INSPECTOR  ·  ${mode}  ·  ${current ? `finding ${state.cursor + 1}/${visible.length}` : "no matching findings"}`;
  stats.content = [
    ` ${state.findings.length} total`,
    `${visible.length} visible`,
    `${state.findings.filter((f) => f.selected).length} selected`,
    `${state.findings.filter((f) => f.risk === "elevated").length} protected/elevated`,
    state.query ? `search: "${state.query}"` : "search: all",
    state.risk ? `risk: ${state.risk}` : "risk: all",
  ].join("   ");
  listHeader.visible = showTable;
  listHeader.content = showTable ? findingTableHeader() : "";
  for (const child of listRows) {
    list.remove(child);
    child.destroy();
  }
  listRows.length = 0;
  if (state.view === "summary" || state.view === "detail") {
    for (const [i, f] of window.findings.entries()) {
      const current = i + window.start === state.cursor;
      const item = new TextRenderable(renderer, {
        content: row(f, Boolean(f.selected), current),
        width: "100%",
        height: 1,
        truncate: true,
        fg: current ? palette.accent : palette.text,
        bg: current ? "#263244" : undefined,
      });
      list.add(item);
      listRows.push(item);
    }
    if (!window.findings.length) {
      const empty = new TextRenderable(renderer, {
        content:
          "No findings match these filters. Press / to search again or r to change risk.",
        width: "100%",
        wrapMode: "word",
        fg: palette.muted,
      });
      list.add(empty);
      listRows.push(empty);
    }
  } else {
    const content =
      state.view === "dry-run"
        ? dryRun(state)
        : state.view === "confirm"
          ? confirmation(state)
          : state.view === "history"
            ? help()
            : errorPanel(state);
    const text = new TextRenderable(renderer, {
      content,
      width: "100%",
      wrapMode: "word",
      fg: palette.text,
    });
    list.add(text);
    listRows.push(text);
  }
  detailText.content = rightPanel(state);
  details.scrollTo(0);
  const localCursor = state.cursor - window.start;
  const viewportRows = Math.max(1, list.height - 1);
  const currentTop = list.scrollTop;
  const nextTop =
    localCursor < currentTop
      ? localCursor
      : localCursor >= currentTop + viewportRows
        ? localCursor - viewportRows + 1
        : currentTop;
  list.scrollTo({ x: list.scrollLeft, y: Math.max(0, nextTop) });
  footer.content = footerText(state.view);
  search.value = state.query;
}

function rightPanel(state: UiState): string {
  if (state.view === "summary" || state.view === "detail") return detail(state);
  if (state.view === "dry-run")
    return "PREVIEW\n\nNo files are changed.\n\nThis shows what the selected actions would do.\nPress c to continue, or Esc to return.";
  if (state.view === "confirm")
    return "FINAL REVIEW\n\nThe scan is still read-only.\nPress y to acknowledge this preview, or Esc to return.";
  if (state.view === "error") return errorPanel(state);
  return "HELP\n\nThe left panel shows the keyboard guide.\nPress Esc or Backspace to return to the findings.";
}

function footerText(view: UiState["view"]): string {
  if (view === "dry-run") return " c confirm   Esc back   q quit ";
  if (view === "confirm") return " y acknowledge   Esc back   q quit ";
  if (view === "detail")
    return " j/k move  Space select  y copy path  Esc back  q quit ";
  if (view === "history" || view === "error") return " Esc back   q quit ";
  return " j/k or ↑/↓ move  g/G ends  Ctrl-d/u page  Space select  / search  r risk  Enter details  y copy path  d preview  ? help  q quit ";
}

function keyStroke(key: KeyEvent): string {
  const name = key.name.length === 1 ? key.name.toLowerCase() : key.name;
  const shift = key.shift || key.name === "G";
  return [key.ctrl ? "ctrl" : "", shift ? "shift" : "", name]
    .filter(Boolean)
    .join("+");
}

export async function startInteractiveTui(
  findings: Finding[],
  initialDryRun = false,
): Promise<void> {
  const renderer: CliRenderer = await createCliRenderer({
    exitOnCtrlC: true,
    backgroundColor: palette.bg,
    useKittyKeyboard: { disambiguate: true },
  });
  let state: UiState = makeUiState(findings);
  if (initialDryRun) state = setView(state, "dry-run");
  const root = new BoxRenderable(renderer, {
    flexDirection: "column",
    width: "100%",
    height: "100%",
    backgroundColor: palette.bg,
    padding: 1,
  });
  const header = new TextRenderable(renderer, {
    height: 1,
    fg: palette.accent,
    content: "",
  });
  const search = new InputRenderable(renderer, {
    width: "100%",
    placeholder: "Search findings (press / to focus)",
    backgroundColor: palette.panel,
    focusedBackgroundColor: "#263244",
    textColor: palette.text,
    focusedTextColor: palette.accent,
  });
  const stats = new TextRenderable(renderer, {
    height: 1,
    fg: palette.muted,
    content: "",
  });
  const body = new BoxRenderable(renderer, {
    flexDirection: "row",
    flexGrow: 1,
    gap: 1,
  });
  const listPanel = new BoxRenderable(renderer, {
    title: " Findings ",
    border: true,
    borderColor: palette.border,
    width: "62%",
    flexDirection: "column",
    overflow: "hidden",
    padding: 1,
  });
  const detailPanel = new BoxRenderable(renderer, {
    title: " Detail ",
    border: true,
    borderColor: palette.border,
    width: "38%",
    overflow: "hidden",
    padding: 1,
  });
  const list = new ScrollBoxRenderable(renderer, {
    width: "100%",
    flexGrow: 1,
    viewportCulling: true,
    scrollbarOptions: { showArrows: true },
  });
  const listHeader = new TextRenderable(renderer, {
    content: findingTableHeader(),
    height: 1,
    width: "100%",
    fg: palette.muted,
  });
  const details = new ScrollBoxRenderable(renderer, {
    width: "100%",
    flexGrow: 1,
    viewportCulling: true,
    scrollbarOptions: { showArrows: true },
  });
  const detailText = new TextRenderable(renderer, {
    content: "",
    width: "100%",
    wrapMode: "word",
    fg: palette.text,
  });
  const listRows: TextRenderable[] = [];
  const footer = new TextRenderable(renderer, {
    height: 1,
    fg: palette.muted,
    content: "",
  });
  listPanel.add(listHeader);
  listPanel.add(list);
  details.add(detailText);
  detailPanel.add(details);
  body.add(listPanel);
  body.add(detailPanel);
  root.add(header);
  root.add(search);
  root.add(stats);
  root.add(body);
  root.add(footer);
  renderer.root.add(root);
  search.on("input", () => {
    state = { ...state, query: search.value, cursor: 0 };
    refresh(
      renderer,
      state,
      header,
      stats,
      listHeader,
      list,
      listRows,
      details,
      detailText,
      footer,
      search,
    );
  });
  await new Promise<void>((resolve) => {
    renderer.once("destroy", resolve);
    renderer.keyInput.on("keypress", (key) => {
      const stroke = keyStroke(key);
      try {
        if (stroke === keymap.quit) {
          renderer.destroy();
          return;
        }
        if (search.focused) {
          if (stroke === "escape" || stroke === "return") {
            search.blur();
            refresh(
              renderer,
              state,
              header,
              stats,
              listHeader,
              list,
              listRows,
              details,
              detailText,
              footer,
              search,
            );
          }
          // Backspace/Delete belongs to OpenTUI's focused input editor.
          return;
        }
        if (stroke === "escape" && state.view === "summary") {
          renderer.destroy();
          return;
        }
        if (keymap.back.includes(stroke as never)) {
          if (state.view !== "summary") {
            state = setView(state, "summary");
            refresh(
              renderer,
              state,
              header,
              stats,
              listHeader,
              list,
              listRows,
              details,
              detailText,
              footer,
              search,
            );
          } else {
            // Backspace is the macOS Delete key. It must never quit the TUI.
            return;
          }
          return;
        }
        if (stroke === keymap.search) {
          search.focus();
          return;
        }
        if (keymap.help.includes(stroke as never))
          state = setView(state, "history");
        else if (keymap.moveUp.includes(stroke as never))
          state = moveCursor(state, -1);
        else if (keymap.moveDown.includes(stroke as never))
          state = moveCursor(state, 1);
        else if (stroke === keymap.first) state = jumpCursor(state, "first");
        else if (stroke === keymap.last) state = jumpCursor(state, "last");
        else if (stroke === keymap.pageDown) state = pageCursor(state, 1);
        else if (stroke === keymap.pageUp) state = pageCursor(state, -1);
        else if (stroke === keymap.select) state = toggleSelection(state);
        else if (stroke === keymap.details) state = setView(state, "detail");
        else if (stroke === keymap.dryRun) state = setView(state, "dry-run");
        else if (stroke === keymap.confirm && state.view === "dry-run")
          state = setView(state, "confirm");
        else if (
          stroke === keymap.copyPath &&
          (state.view === "summary" || state.view === "detail")
        ) {
          const current = visibleFindings(state)[state.cursor];
          if (current) {
            const copied = renderer.copyToClipboardOSC52(current.path);
            renderer.triggerNotification(
              copied ? "Path copied to clipboard" : "Path ready to copy",
              "Leftover Inspector",
            );
          }
        } else if (stroke === keymap.acknowledge && state.view === "confirm") {
          renderer.triggerNotification(
            "Acknowledged. Scan mode performed no mutation.",
            "Leftover Inspector",
          );
          state = setView(state, "dry-run");
        } else if (stroke === keymap.filterRisk)
          state = {
            ...state,
            risk:
              state.risk === undefined
                ? "review"
                : state.risk === "review"
                  ? "elevated"
                  : undefined,
            cursor: 0,
          };
        else if (stroke === "backspace" && state.view !== "summary") {
          search.blur();
          state = setView(state, "summary");
        }
        refresh(
          renderer,
          state,
          header,
          stats,
          listHeader,
          list,
          listRows,
          details,
          detailText,
          footer,
          search,
        );
      } catch (error) {
        state = setError(state, error);
        refresh(
          renderer,
          state,
          header,
          stats,
          listHeader,
          list,
          listRows,
          details,
          detailText,
          footer,
          search,
        );
      }
    });
    refresh(
      renderer,
      state,
      header,
      stats,
      listHeader,
      list,
      listRows,
      details,
      detailText,
      footer,
      search,
    );
  });
}
