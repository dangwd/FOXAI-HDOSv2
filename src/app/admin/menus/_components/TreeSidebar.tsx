"use client";

import { useState } from "react";
import { Input } from "antd";
import { ChevronRight, ChevronDown, Plus } from "lucide-react";
import type { AdminMenuNode } from "@/infrastructure/http/adminApi";
import type { MenuUpsertForm } from "../_lib/types";
import { BLANK_MENU_FORM } from "../_lib/types";
import { MenuFormDrawer } from "./MenuFormDrawer";

function TreeNode({
  node,
  depth,
  selId,
  expanded,
  getChildNodes,
  onSelect,
  onToggle,
}: {
  node:          AdminMenuNode;
  depth:         number;
  selId:         string | null;
  expanded:      Set<string>;
  getChildNodes: (id: string) => AdminMenuNode[];
  onSelect:      (id: string) => void;
  onToggle:      (id: string) => void;
}) {
  const children    = getChildNodes(node.id);
  const hasChildren = children.length > 0;
  const active      = node.id === selId;
  const isExpanded  = expanded.has(node.id);

  return (
    <div>
      <div
        className={`
          flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer select-none
          transition-colors group
          ${active
            ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300"
            : "text-gray-700 dark:text-[#c9d1d9] hover:bg-gray-100 dark:hover:bg-[#1f2937]"
          }
        `}
        style={{ paddingLeft: `${8 + depth * 14}px` }}
        onClick={() => onSelect(node.id)}
      >
        <button
          className={`w-4 h-4 flex items-center justify-center shrink-0 text-gray-400 dark:text-[#484f58] ${!hasChildren ? "opacity-0 pointer-events-none" : ""}`}
          onClick={(e) => { e.stopPropagation(); onToggle(node.id); }}
        >
          {hasChildren && (isExpanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />)}
        </button>

        <span className="text-[14px] leading-none shrink-0">{node.icon || "📊"}</span>
        <span className="flex-1 text-xs font-medium truncate">{node.name}</span>

        <div className="flex items-center gap-1 shrink-0">
          {!node.isVisible && (
            <span className="text-[9px] px-1 py-0.5 rounded bg-gray-200 dark:bg-[#30363d] text-gray-500 dark:text-[#484f58] font-medium">
              Ẩn
            </span>
          )}
          {node.screenCount > 0 && (
            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold tabular-nums ${
              active
                ? "bg-emerald-200 dark:bg-emerald-700/40 text-emerald-700 dark:text-emerald-300"
                : "bg-gray-100 dark:bg-[#30363d] text-gray-500 dark:text-[#8b949e]"
            }`}>
              {node.screenCount}
            </span>
          )}
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div>
          {children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              selId={selId}
              expanded={expanded}
              getChildNodes={getChildNodes}
              onSelect={onSelect}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function TreeSidebar({
  menus,
  selId,
  expanded,
  onSelect,
  onToggle,
  onCreate,
}: {
  menus:    AdminMenuNode[];
  selId:    string | null;
  expanded: Set<string>;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
  onCreate: (form: MenuUpsertForm) => Promise<void>;
}) {
  const [showModal, setShowModal] = useState(false);
  const [search,    setSearch]    = useState("");

  const roots         = menus.filter((m) => m.parentId === null);
  const getChildNodes = (id: string) => menus.filter((m) => m.parentId === id);
  const filtered      = search.trim()
    ? menus.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()))
    : null;

  const renderNodes = filtered ?? roots;

  return (
    <aside className="w-64 shrink-0 border-r border-gray-200 dark:border-[#1f2937] bg-white dark:bg-[#0a0f1a] flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-[#1f2937] shrink-0 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-gray-700 dark:text-[#e6edf3]">
              Menu báo cáo
            </span>
            {menus.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-[#1f2937] text-gray-500 dark:text-[#8b949e] font-semibold tabular-nums">
                {menus.length}
              </span>
            )}
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="w-6 h-6 flex items-center justify-center rounded-md text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-[#2d2542] transition-colors"
            title="Tạo menu mới"
          >
            <Plus size={13} />
          </button>
        </div>
        <Input
          size="small"
          placeholder="Tìm menu..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
        />
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto px-1.5 py-2 space-y-0.5">
        {renderNodes.length === 0 && (
          <p className="text-xs text-center text-gray-400 dark:text-[#484f58] py-6">
            {search ? "Không tìm thấy" : "Chưa có menu nào"}
          </p>
        )}
        {renderNodes.map((node) => (
          <TreeNode
            key={node.id}
            node={node}
            depth={0}
            selId={selId}
            expanded={expanded}
            getChildNodes={filtered ? () => [] : getChildNodes}
            onSelect={onSelect}
            onToggle={onToggle}
          />
        ))}
      </div>

      <MenuFormDrawer
        open={showModal}
        isEdit={false}
        initial={BLANK_MENU_FORM}
        menus={menus}
        onClose={() => setShowModal(false)}
        onSubmit={async (form) => {
          await onCreate(form);
          setShowModal(false);
        }}
      />
    </aside>
  );
}
