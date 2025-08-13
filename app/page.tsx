"use client";

import { useEffect, useMemo, useRef, useState } from 'react';

type Todo = {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
};

type Filter = 'all' | 'active' | 'completed';

const STORAGE_KEY = 'next-todo-app:v1';

function useLocalTodos() {
  const [todos, setTodos] = useState<Todo[]>([]);

  // Hydrate from localStorage once on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Todo[];
        if (Array.isArray(parsed)) setTodos(parsed);
      }
    } catch (e) {
      console.error('Failed to load todos', e);
    }
  }, []);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    } catch (e) {
      console.error('Failed to save todos', e);
    }
  }, [todos]);

  return { todos, setTodos } as const;
}

export default function Page() {
  const { todos, setTodos } = useLocalTodos();
  const [filter, setFilter] = useState<Filter>('all');
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    if (filter === 'active') return todos.filter(t => !t.completed);
    if (filter === 'completed') return todos.filter(t => t.completed);
    return todos;
  }, [todos, filter]);

  const remaining = useMemo(() => todos.filter(t => !t.completed).length, [todos]);

  function addTodo(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    const todo: Todo = {
      id: crypto.randomUUID(),
      text: trimmed,
      completed: false,
      createdAt: Date.now(),
    };
    setTodos(prev => [todo, ...prev]);
    setInput('');
    inputRef.current?.focus();
  }

  function toggle(id: string) {
    setTodos(prev => prev.map(t => (t.id === id ? { ...t, completed: !t.completed } : t)));
  }

  function remove(id: string) {
    setTodos(prev => prev.filter(t => t.id !== id));
  }

  function clearCompleted() {
    setTodos(prev => prev.filter(t => !t.completed));
  }

  function edit(id: string, text: string) {
    setTodos(prev => prev.map(t => (t.id === id ? { ...t, text } : t)));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    addTodo(input);
  }

  return (
    <main className="card">
      <form className="inputRow" onSubmit={onSubmit}>
        <input
          ref={inputRef}
          type="text"
          placeholder="What needs to be done?"
          value={input}
          onChange={e => setInput(e.target.value)}
          aria-label="New todo"
        />
        <button type="submit" disabled={!input.trim()}>Add</button>
      </form>

      {filtered.length === 0 ? (
        <div className="emptyState">No tasks {filter !== 'all' ? `in ${filter}` : ''}. Add one above.</div>
      ) : (
        <ul className="list">
          {filtered.map(todo => (
            <TodoItem key={todo.id} todo={todo} onToggle={toggle} onRemove={remove} onEdit={edit} />)
          )}
        </ul>
      )}

      <div className="footer">
        <small>{remaining} item{remaining === 1 ? '' : 's'} left</small>
        <div className="filters" role="tablist" aria-label="Filter todos">
          <button className={`filterBtn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
            All
          </button>
          <button className={`filterBtn ${filter === 'active' ? 'active' : ''}`} onClick={() => setFilter('active')}>
            Active
          </button>
          <button className={`filterBtn ${filter === 'completed' ? 'active' : ''}`} onClick={() => setFilter('completed')}>
            Completed
          </button>
        </div>
        <button className="iconBtn" onClick={clearCompleted} aria-label="Clear completed">Clear completed</button>
      </div>
    </main>
  );
}

function TodoItem({ todo, onToggle, onRemove, onEdit }: {
  todo: Todo;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onEdit: (id: string, text: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(todo.text);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) inputRef.current?.focus();
  }, [isEditing]);

  function finishEdit() {
    const trimmed = draft.trim();
    if (!trimmed) {
      onRemove(todo.id);
    } else if (trimmed !== todo.text) {
      onEdit(todo.id, trimmed);
    }
    setIsEditing(false);
  }

  return (
    <li className="item">
      <label>
        <input type="checkbox" checked={todo.completed} onChange={() => onToggle(todo.id)} aria-label={`Toggle ${todo.text}`} />
      </label>
      {isEditing ? (
        <input
          ref={inputRef}
          className="editInput"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={finishEdit}
          onKeyDown={e => {
            if (e.key === 'Enter') finishEdit();
            if (e.key === 'Escape') { setDraft(todo.text); setIsEditing(false); }
          }}
          aria-label="Edit todo"
        />
      ) : (
        <span className={`itemText ${todo.completed ? 'completed' : ''}`} onDoubleClick={() => setIsEditing(true)}>
          {todo.text}
        </span>
      )}
      <div className="itemActions">
        <button className="iconBtn" onClick={() => setIsEditing(v => !v)} aria-label="Edit">{isEditing ? 'Save' : 'Edit'}</button>
        <button className="iconBtn" onClick={() => onRemove(todo.id)} aria-label="Delete">Delete</button>
      </div>
    </li>
  );
}
