import React, { useEffect, useState } from "react";
import apiClient from "api/client";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { setCurrentUser } from "store/slices/usersSlice";

const UserSelector: React.FC = () => {
  const dispatch = useAppDispatch();
  const currentId = useAppSelector((s) => s.users.currentId);

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const loadUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.get("/users");
      const list = res.data as any[];
      setUsers(list);

      if (list.length === 0) {
        const created = await apiClient.post("/users", {
          name: "Demo Student",
          email: "demo@student.com",
        });
        const demo = created.data;
        setUsers([demo]);
        dispatch(setCurrentUser(demo.id));
      } else if (!currentId) {
        dispatch(setCurrentUser(list[0].id));
      }
    } catch (e: any) {
      setError(e.message ?? "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setCreating(true);
    setCreateError("");
    try {
      const res = await apiClient.post("/users", { name, email });
      const user = res.data;
      setUsers((prev) => [...prev, user]);
      dispatch(setCurrentUser(user.id));
      setName("");
      setEmail("");
      setShowCreate(false);
    } catch (e: any) {
      setCreateError(
        e.response?.data?.detail ?? e.message ?? "Failed to create user",
      );
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="mb-8 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <p className="text-sm text-gray-400 animate-pulse">Loading users...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-8 rounded-xl border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-600">{error}</p>
        <button
          onClick={loadUsers}
          className="mt-2 text-sm text-red-700 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  const current = users.find((u) => u.id === currentId);

  return (
    <div className="mb-8 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm font-medium text-gray-600">👤 User:</span>

        <select
          value={currentId ?? ""}
          onChange={(e) => dispatch(setCurrentUser(e.target.value))}
          className="flex-1 min-w-[180px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        >
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>

        {current?.learning_style && (
          <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs text-indigo-700">
            {current.learning_style}
          </span>
        )}

        <button
          onClick={() => {
            setShowCreate(!showCreate);
            setCreateError("");
          }}
          className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100"
        >
          + New
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="mt-4 border-t pt-4 space-y-3">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                placeholder="Student name"
                required
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                placeholder="student@example.com"
                type="email"
                required
              />
            </div>
          </div>
          {createError && (
            <p className="text-xs text-red-500">{createError}</p>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={creating}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {creating ? "Creating..." : "Create"}
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default UserSelector;
