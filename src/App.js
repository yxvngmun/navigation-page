import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FileText, Info, CheckCircle, Plus, MoreVertical, Edit, Copy, Trash2 } from 'lucide-react';

const generateId = () => Math.random().toString(36).substring(2, 9);

function ContextMenu ({ x, y, onClose, onAction }){
  const menuRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div ref={menuRef} className="absolute bg-white shadow-lg rounded-lg py-1 z-50 border border-gray-200" style={{ top: y, left: x }}>
      {[{ icon: Edit, label: 'Rename', action: 'rename' }, { icon: Copy, label: 'Duplicate', action: 'duplicate' }, { icon: Trash2, label: 'Delete', action: 'delete' }].map(({ icon: Icon, label, action }) => (
        <button key={label} className={`flex items-center w-full px-4 py-2 text-sm ${label === 'Delete' ? 'text-red-600 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-100'}`} onClick={() => { onAction(action); onClose(); }}>
          <Icon className="mr-2 h-4 w-4" /> {label}
        </button>
      ))}
    </div>
  );
};

function PageItem ({ page, isActive, onSelect, onDragStart, onDragEnter, onDragEnd, onContextMenu, isDragging, isEditing, onRename }){
  const Icon = { Info, Details: FileText, Other: FileText, Ending: CheckCircle }[page.type || 'Other'] || FileText;
  const [editName, setEditName] = useState(page.name);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing) inputRef.current?.focus();
  }, [isEditing]);

  return (
    <div className={`relative flex items-center ${isDragging ? 'opacity-50' : ''}`}>
      <div
        className={`flex items-center px-4 py-2 rounded-xl shadow-sm cursor-pointer transition-all duration-200 mr-1 ${isActive ? 'bg-blue-50 border border-blue-500 text-blue-700 shadow-md scale-105' : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-300 hover:shadow-md'} ${isDragging ? 'border-dashed border-2 border-blue-400' : ''}`}
        onClick={() => onSelect(page.id)}
        onContextMenu={(e) => { e.preventDefault(); onContextMenu(e, page.id); }}
        draggable
        onDragStart={(e) => { e.stopPropagation(); onDragStart(e, page.id); }}
        onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); onDragEnter(page.id); }}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onDrop={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onDragEnd={onDragEnd}
      >
        <Icon className={`mr-2 h-5 w-5 ${isActive ? 'text-blue-500' : 'text-gray-500'}`} />
        {isEditing ? (
          <input
            ref={inputRef}
            className="text-sm font-medium bg-transparent border-b border-blue-300 focus:outline-none focus:border-blue-500"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={() => onRename(page.id, editName)}
            onKeyDown={(e) => e.key === 'Enter' && onRename(page.id, editName)}
          />
        ) : (
          <span className="font-medium text-sm">{page.name}</span>
        )}
        <button className="ml-2 p-1 rounded-full hover:bg-gray-200" onClick={(e) => { e.stopPropagation(); onContextMenu(e, page.id); }}>
          <MoreVertical className="h-4 w-4 text-gray-500" />
        </button>
      </div>
    </div>
  );
};

function App(){
  const [pages, setPages] = useState([
    { id: generateId(), name: 'Info', type: 'Info' },
    { id: generateId(), name: 'Details', type: 'Details' },
    { id: generateId(), name: 'Other', type: 'Other' },
    { id: generateId(), name: 'Ending', type: 'Ending' },
  ]);
  const [activePageId, setActivePageId] = useState(pages[0].id);
  const [draggedItem, setDraggedItem] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const handleSelectPage = useCallback((id) => setActivePageId(id), []);

  const handleAddPage = useCallback((targetId, position = 'after') => {
    const newPage = { id: generateId(), name: `New Page ${pages.length + 1}`, type: 'Other' };
    setPages((prev) => {
      const updated = [...prev];
      const i = updated.findIndex(p => p.id === targetId);
      if (i === -1 || targetId === 'end') updated.push(newPage);
      else updated.splice(position === 'after' ? i + 1 : i, 0, newPage);
      return updated;
    });
  }, [pages.length]);

  const handleDragStart = useCallback((e, id) => {
    setDraggedItem(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  }, []);

  const handleDragEnter = useCallback((id) => {
    if (draggedItem === null || draggedItem === id) return;
    setPages((prev) => {
      const updated = [...prev];
      const from = updated.findIndex(p => p.id === draggedItem);
      const to = updated.findIndex(p => p.id === id);
      if (from === -1 || to === -1) return prev;
      const [moved] = updated.splice(from, 1);
      updated.splice(to, 0, moved);
      return updated;
    });
  }, [draggedItem]);

  const handleContextMenu = useCallback((e, id) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, pageId: id });
  }, []);
  const handleContextAction = useCallback((action) => {
    if (!contextMenu) return;
    const page = pages.find(p => p.id === contextMenu.pageId);
    if (!page) return;

    if (action === 'delete') {
      const filtered = pages.filter(p => p.id !== page.id);
      setPages(filtered);
      if (activePageId === page.id) setActivePageId(filtered[0]?.id || null);
    } else if (action === 'duplicate') {
      const copy = { ...page, id: generateId(), name: `${page.name} (Copy)` };
      setPages(prev => {
        const i = prev.findIndex(p => p.id === page.id);
        const arr = [...prev];
        arr.splice(i + 1, 0, copy);
        return arr;
      });
    } else if (action === 'rename') {
      setEditingId(page.id);
    }
    setContextMenu(null);
  }, [contextMenu, pages, activePageId]);

  function handleRename (id, newName){
    setPages(prev => prev.map(p => p.id === id ? { ...p, name: newName.trim() } : p));
    setEditingId(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="flex items-center bg-white p-4 rounded-2xl shadow-xl border border-gray-200 overflow-x-auto">
        {pages.map((page, i) => (
          <React.Fragment key={page.id}>
            <PageItem
              page={page}
              isActive={activePageId === page.id}
              onSelect={handleSelectPage}
              onDragStart={handleDragStart}
              onDragEnter={handleDragEnter}
              onDragEnd={() => setDraggedItem(null)}
              onContextMenu={handleContextMenu}
              isDragging={draggedItem === page.id}
              isEditing={editingId === page.id}
              onRename={handleRename}
            />
            {i < pages.length - 1 && (
              <div className="relative flex items-center w-6 mx-1 group">
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <button className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-200 hover:scale-110" onClick={() => handleAddPage(page.id, 'after')}>
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <div className="w-full h-px bg-gray-400 border-t border-dashed" />
              </div>
            )}
          </React.Fragment>
        ))}
        <button className="flex items-center px-4 py-2 rounded-xl shadow-sm bg-white border border-gray-300 text-gray-700 hover:border-gray-400 hover:shadow-md ml-1" onClick={() => handleAddPage('end')}>
          <Plus className="mr-2 h-5 w-5 text-gray-500" />
          <span className="font-medium text-sm">Add page</span>
        </button>
      </div>
      {contextMenu && (
        <ContextMenu x={contextMenu.x} y={contextMenu.y} onClose={() => setContextMenu(null)} onAction={handleContextAction} />
      )}
    </div>
  );
};

export default App;