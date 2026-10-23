"use client";

import { TableKit } from "@tiptap/extension-table";
import TextAlign from "@tiptap/extension-text-align";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Columns3,
  Italic,
  Link2,
  Link2Off,
  List,
  ListOrdered,
  Redo2,
  Rows3,
  Strikethrough,
  Table,
  TableCellsMerge,
  TableCellsSplit,
  Trash2,
  Underline,
  Undo2,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

import rich from "@/components/ui/RichText.module.css";
import { safeHref, type RichNode } from "@/lib/rich-text";
import { cx } from "@/lib/cx";

import s from "./RichTextEditor.module.css";

/**
 * The rich-text editor (Tiptap, open-source extensions only): headings, bold to strikethrough,
 * alignment, lists, links and tables. Text pasted from Word or a PDF keeps what the editor
 * supports (headings, lists, tables, bold, links); anything else becomes plain text. The document
 * is submitted as JSON in a hidden field named `name`, and sanitised again on the server.
 */
export function RichTextEditor({
  name,
  initial,
  labelledBy,
  describedBy,
  invalid,
  onChange,
}: {
  name: string;
  initial: RichNode;
  labelledBy: string;
  describedBy?: string;
  invalid?: boolean;
  /**
   * Called with the editor when it is created and on every change, e.g. to preview what is
   * being written. React's development mode creates and destroys an editor before the one that
   * stays, so check `isDestroyed` before using one kept from here.
   */
  onChange?: (editor: Editor) => void;
}) {
  const [json, setJson] = useState(() => JSON.stringify(initial));
  const editor = useEditor({
    // rendered in the browser only, so the server and the first client render agree
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        code: false,
        codeBlock: false,
        heading: { levels: [2, 3, 4] },
        link: {
          openOnClick: false,
          autolink: true,
          defaultProtocol: "https",
          protocols: ["http", "https", "mailto", "tel"],
          // the same rule the server applies: no javascript:, data: or other schemes
          isAllowedUri: (url, ctx) => ctx.defaultValidate(url) && safeHref(url) !== null,
          HTMLAttributes: { rel: "noopener noreferrer nofollow", target: null },
        },
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TableKit.configure({ table: { resizable: false } }),
    ],
    content: initial,
    editorProps: {
      attributes: {
        class: cx(rich.rich, s.content),
        role: "textbox",
        "aria-multiline": "true",
        "aria-labelledby": labelledBy,
        ...(describedBy ? { "aria-describedby": describedBy } : {}),
        ...(invalid ? { "aria-invalid": "true" } : {}),
      },
    },
    onCreate: ({ editor }) => onChange?.(editor),
    onUpdate: ({ editor }) => {
      setJson(JSON.stringify(editor.getJSON()));
      onChange?.(editor);
    },
  });

  return (
    <div className={cx(s.editor, invalid && s.invalid)}>
      <input type="hidden" name={name} value={json} />
      {editor ? <Toolbar editor={editor} /> : <div className={s.toolbar} aria-hidden="true" />}
      <EditorContent editor={editor} />
      {!editor && <div className={cx(rich.rich, s.content, s.loading)}>Loading the editor…</div>}
    </div>
  );
}

function ToolButton({
  icon: Icon,
  label,
  onClick,
  active,
  disabled,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={s.button}
      // keep the editor's focus and selection: the command then applies to them at once
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active === undefined ? undefined : active}
      aria-label={label}
      title={label}
    >
      <Icon aria-hidden="true" />
    </button>
  );
}

const Group = ({ label, children }: { label: string; children: ReactNode }) => (
  <div role="group" aria-label={label} className={s.group}>
    {children}
  </div>
);

function Toolbar({ editor }: { editor: Editor }) {
  // the toolbar follows the selection (which marks are on, whether the cursor is in a table)
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      block: e.isActive("heading", { level: 2 })
        ? "h2"
        : e.isActive("heading", { level: 3 })
          ? "h3"
          : e.isActive("heading", { level: 4 })
            ? "h4"
            : "p",
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      underline: e.isActive("underline"),
      strike: e.isActive("strike"),
      link: e.isActive("link"),
      bullet: e.isActive("bulletList"),
      ordered: e.isActive("orderedList"),
      align:
        (["center", "right", "justify"] as const).find((a) => e.isActive({ textAlign: a })) ??
        "left",
      inTable: e.isActive("table"),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
      canMerge: e.can().mergeCells(),
      canSplit: e.can().splitCell(),
    }),
  });
  const chain = () => editor.chain().focus();

  const [linking, setLinking] = useState(false);
  const setLink = () => setLinking(true);

  return (
    <>
      {linking && <LinkDialog editor={editor} onClose={() => setLinking(false)} />}
      <div role="toolbar" aria-label="Formatting" className={s.toolbar}>
        <Group label="History">
          <ToolButton
            icon={Undo2}
            label="Undo"
            onClick={() => chain().undo().run()}
            disabled={!state.canUndo}
          />
          <ToolButton
            icon={Redo2}
            label="Redo"
            onClick={() => chain().redo().run()}
            disabled={!state.canRedo}
          />
        </Group>

        <Group label="Text style">
          <select
            className={s.select}
            aria-label="Text style"
            value={state.block}
            onChange={(event) => {
              const value = event.target.value;
              if (value === "p") chain().setParagraph().run();
              else
                chain()
                  .setHeading({ level: Number(value.slice(1)) as 2 | 3 | 4 })
                  .run();
            }}
          >
            <option value="p">Paragraph</option>
            <option value="h2">Heading</option>
            <option value="h3">Subheading</option>
            <option value="h4">Small heading</option>
          </select>
        </Group>

        <Group label="Emphasis">
          <ToolButton
            icon={Bold}
            label="Bold"
            active={state.bold}
            onClick={() => chain().toggleBold().run()}
          />
          <ToolButton
            icon={Italic}
            label="Italic"
            active={state.italic}
            onClick={() => chain().toggleItalic().run()}
          />
          <ToolButton
            icon={Underline}
            label="Underline"
            active={state.underline}
            onClick={() => chain().toggleUnderline().run()}
          />
          <ToolButton
            icon={Strikethrough}
            label="Strikethrough"
            active={state.strike}
            onClick={() => chain().toggleStrike().run()}
          />
        </Group>

        <Group label="Alignment">
          <ToolButton
            icon={AlignLeft}
            label="Align left"
            active={state.align === "left"}
            onClick={() => chain().setTextAlign("left").run()}
          />
          <ToolButton
            icon={AlignCenter}
            label="Centre"
            active={state.align === "center"}
            onClick={() => chain().setTextAlign("center").run()}
          />
          <ToolButton
            icon={AlignRight}
            label="Align right"
            active={state.align === "right"}
            onClick={() => chain().setTextAlign("right").run()}
          />
          <ToolButton
            icon={AlignJustify}
            label="Justify"
            active={state.align === "justify"}
            onClick={() => chain().setTextAlign("justify").run()}
          />
        </Group>

        <Group label="Lists and links">
          <ToolButton
            icon={List}
            label="Bulleted list"
            active={state.bullet}
            onClick={() => chain().toggleBulletList().run()}
          />
          <ToolButton
            icon={ListOrdered}
            label="Numbered list"
            active={state.ordered}
            onClick={() => chain().toggleOrderedList().run()}
          />
          <ToolButton
            icon={Link2}
            label={state.link ? "Edit link" : "Add link"}
            active={state.link}
            onClick={setLink}
          />
          <ToolButton
            icon={Link2Off}
            label="Remove link"
            onClick={() => chain().extendMarkRange("link").unsetLink().run()}
            disabled={!state.link}
          />
        </Group>

        <Group label="Table">
          <ToolButton
            icon={Table}
            label="Insert table (3 × 3, with a header row)"
            onClick={() => chain().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
            disabled={state.inTable}
          />
          {state.inTable && (
            <>
              <TextButton onClick={() => chain().addRowBefore().run()}>Row above</TextButton>
              <TextButton onClick={() => chain().addRowAfter().run()}>Row below</TextButton>
              <ToolButton
                icon={Rows3}
                label="Delete row"
                onClick={() => chain().deleteRow().run()}
              />
              <TextButton onClick={() => chain().addColumnBefore().run()}>Column left</TextButton>
              <TextButton onClick={() => chain().addColumnAfter().run()}>Column right</TextButton>
              <ToolButton
                icon={Columns3}
                label="Delete column"
                onClick={() => chain().deleteColumn().run()}
              />
              <TextButton onClick={() => chain().toggleHeaderRow().run()}>Header row</TextButton>
              <ToolButton
                icon={TableCellsMerge}
                label="Merge cells"
                onClick={() => chain().mergeCells().run()}
                disabled={!state.canMerge}
              />
              <ToolButton
                icon={TableCellsSplit}
                label="Split cell"
                onClick={() => chain().splitCell().run()}
                disabled={!state.canSplit}
              />
              <ToolButton
                icon={Trash2}
                label="Delete table"
                onClick={() => chain().deleteTable().run()}
              />
            </>
          )}
        </Group>
      </div>
    </>
  );
}

/** A web address typed without its scheme ("www.rub.edu.bt") as https. */
const withScheme = (value: string) =>
  /^[a-z][a-z0-9+.-]*:|^\/|^#/i.test(value) ? value : `https://${value}`;

/**
 * Adding or changing a link: its address (checked with the rule the server applies), and, with
 * no text selected, the text to show. Enter applies, Escape cancels. Not a <form>: it sits inside
 * the post's form.
 */
function LinkDialog({ editor, onClose }: { editor: Editor; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [existing] = useState(() => editor.getAttributes("link").href as string | undefined);
  // with nothing selected and no link under the cursor, the link needs its own text
  const [needsText] = useState(() => editor.state.selection.empty && !existing);
  const [href, setHref] = useState(existing ?? "");
  const [label, setLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const hrefId = useId();
  const labelId = useId();
  const errorId = useId();

  useEffect(() => {
    // React's development mode runs this twice
    if (dialog.current && !dialog.current.open) dialog.current.showModal();
  }, []);

  function close() {
    dialog.current?.close();
    onClose();
    editor.commands.focus();
  }

  function apply() {
    const entered = href.trim();
    if (!entered) {
      setError("Enter the link’s address.");
      return;
    }
    const safe = safeHref(withScheme(entered));
    if (!safe) {
      setError(
        "That link cannot be used. Use a web address (https://…), an email (mailto:…), a phone number (tel:…), a page of this site (/downloads) or a section (#interview).",
      );
      return;
    }
    if (needsText) {
      editor
        .chain()
        .focus()
        .insertContent({
          type: "text",
          text: label.trim() || safe,
          marks: [{ type: "link", attrs: { href: safe } }],
        })
        .run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href: safe }).run();
    }
    dialog.current?.close();
    onClose();
  }

  function remove() {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    dialog.current?.close();
    onClose();
  }

  const onEnter = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      event.preventDefault(); // not the post's form
      apply();
    }
  };

  return (
    <dialog
      ref={dialog}
      aria-labelledby={`${hrefId}-title`}
      className={s.dialog}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
    >
      <h2 id={`${hrefId}-title`} className={s.dialogTitle}>
        {existing ? "Edit link" : "Add link"}
      </h2>
      <label htmlFor={hrefId} className={s.dialogLabel}>
        Link address
      </label>
      <input
        id={hrefId}
        type="text"
        inputMode="url"
        autoComplete="off"
        autoFocus
        value={href}
        onChange={(event) => {
          setHref(event.target.value);
          setError(null);
        }}
        onKeyDown={onEnter}
        placeholder="https://www.rub.edu.bt/…"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : `${hrefId}-help`}
        className={s.dialogInput}
      />
      {error ? (
        <p id={errorId} role="alert" className={s.dialogError}>
          {error}
        </p>
      ) : (
        <p id={`${hrefId}-help`} className={s.dialogHelp}>
          A web address, mailto:, tel:, a page of this site such as /downloads, or a section such as
          #interview.
        </p>
      )}
      {needsText && (
        <>
          <label htmlFor={labelId} className={s.dialogLabel}>
            Text to show
          </label>
          <input
            id={labelId}
            type="text"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            onKeyDown={onEnter}
            placeholder="Left empty, the address is shown"
            className={s.dialogInput}
          />
        </>
      )}
      <div className={s.dialogButtons}>
        {existing && (
          <button type="button" onClick={remove} className={cx(s.dialogButton, s.dialogDanger)}>
            Remove link
          </button>
        )}
        <button type="button" onClick={close} className={s.dialogButton}>
          Cancel
        </button>
        <button type="button" onClick={apply} className={cx(s.dialogButton, s.dialogPrimary)}>
          Apply
        </button>
      </div>
    </dialog>
  );
}

const TextButton = ({ onClick, children }: { onClick: () => void; children: ReactNode }) => (
  <button
    type="button"
    className={cx(s.button, s.textButton)}
    onMouseDown={(event) => event.preventDefault()}
    onClick={onClick}
  >
    {children}
  </button>
);
