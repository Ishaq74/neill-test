import React from "react";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Dialog, DialogContent, DialogTitle, DialogFooter, DialogDescription } from "@components/ui/dialog";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@components/ui/table";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@components/ui/select";
const PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100];
export default function AdminUtilisateurs() {
  const [utilisateurs, setUtilisateurs] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState("all");
  const [openDialog, setOpenDialog] = React.useState(false);
  const [editId, setEditId] = React.useState(null);
  const [form, setForm] = React.useState({ nom: "", email: "", role: "client", password: "" });
  const [feedback, setFeedback] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [deleteId, setDeleteId] = React.useState(null);
  const [toast, setToast] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [sort, setSort] = React.useState({ key: "createdAt", dir: "desc" });

  React.useEffect(() => {
    setLoading(true);
    fetch("/api/utilisateur-db").then(r => r.json()).then(data => {
      setUtilisateurs(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  React.useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast("") , 2500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const handleFormChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };
  const handleOpenAdd = () => {
    setEditId(null);
    setForm({ nom: "", email: "", role: "client", password: "" });
    setOpenDialog(true);
    setFeedback("");
  };
  const handleOpenEdit = u => {
    setEditId(u.id);
    setForm({ nom: u.nom, email: u.email, role: u.role, password: "" });
    setOpenDialog(true);
    setFeedback("");
  };
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditId(null);
    setForm({ nom: "", email: "", role: "client", password: "" });
    setFeedback("");
  };
  const handleSubmit = async e => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback("");
    if (!form.nom.trim() || !form.email.trim() || !form.role.trim() || (!editId && !form.password.trim())) {
      setFeedback("Tous les champs sont obligatoires (mot de passe requis à la création).");
      setSubmitting(false);
      return;
    }
    try {
      const method = editId ? "PATCH" : "POST";
      const url = editId ? `/api/utilisateur-db?id=${editId}` : "/api/utilisateur-db";
      const payload = { ...form };
      if (editId && !form.password) delete payload.password;
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setToast(editId ? "Utilisateur modifié !" : "Utilisateur ajouté !");
        setUtilisateurs(await fetch("/api/utilisateur-db").then(r => r.json()));
        handleCloseDialog();
      } else {
        setFeedback("Erreur lors de l'enregistrement.");
      }
    } catch {
      setFeedback("Erreur réseau.");
    }
    setSubmitting(false);
  };
  const handleDelete = async () => {
    if (!deleteId) return;
    setSubmitting(true);
    setFeedback("");
    try {
      const res = await fetch(`/api/utilisateur-db?id=${deleteId}`, { method: "DELETE" });
      if (res.ok) {
        setToast("Utilisateur supprimé.");
        setUtilisateurs(await fetch("/api/utilisateur-db").then(r => r.json()));
        setDeleteId(null);
      } else {
        setFeedback("Erreur lors de la suppression.");
      }
    } catch {
      setFeedback("Erreur réseau.");
    }
    setSubmitting(false);
  };
  // Filtrage, recherche, tri, pagination
  let filtered = utilisateurs.filter(u => {
    if (search && !(`${u.nom} ${u.email}`.toLowerCase().includes(search.toLowerCase()))) return false;
    if (roleFilter !== "all" && u.role !== roleFilter) return false;
    return true;
  });
  // Tri
  filtered = filtered.sort((a, b) => {
    const { key, dir } = sort;
    let va = a[key] || "";
    let vb = b[key] || "";
    if (key === "createdAt") {
      va = va || ""; vb = vb || "";
      return dir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    }
    if (typeof va === "string" && typeof vb === "string") {
      return dir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    }
    return 0;
  });
  // Pagination
  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  // UI
  return (
    <div className="p-4">
      <div className="flex flex-wrap gap-2 justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Utilisateurs</h1>
        <Button onClick={handleOpenAdd}>Ajouter</Button>
      </div>
      <div className="flex flex-wrap gap-2 mb-4 items-end">
        <Input placeholder="Recherche nom/email..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="w-48" />
        <div>
          <label className="block text-xs font-semibold mb-1">Rôle</label>
          <Select value={roleFilter} onValueChange={v => { setRoleFilter(v); setPage(1); }}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Tous les rôles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="client">Client</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="cursor-pointer" onClick={() => setSort(s => ({ key: "nom", dir: s.key === "nom" && s.dir === "asc" ? "desc" : "asc" }))}>
              Nom {sort.key === "nom" ? (sort.dir === "asc" ? "▲" : "▼") : null}
            </TableHead>
            <TableHead className="cursor-pointer" onClick={() => setSort(s => ({ key: "email", dir: s.key === "email" && s.dir === "asc" ? "desc" : "asc" }))}>
              Email {sort.key === "email" ? (sort.dir === "asc" ? "▲" : "▼") : null}
            </TableHead>
            <TableHead className="cursor-pointer" onClick={() => setSort(s => ({ key: "role", dir: s.key === "role" && s.dir === "asc" ? "desc" : "asc" }))}>
              Rôle {sort.key === "role" ? (sort.dir === "asc" ? "▲" : "▼") : null}
            </TableHead>
            <TableHead className="cursor-pointer" onClick={() => setSort(s => ({ key: "createdAt", dir: s.key === "createdAt" && s.dir === "asc" ? "desc" : "asc" }))}>
              Créé le {sort.key === "createdAt" ? (sort.dir === "asc" ? "▲" : "▼") : null}
            </TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginated.length === 0 ? (
            <TableRow><TableCell colSpan={5}>Aucun utilisateur.</TableCell></TableRow>
          ) : (
            paginated.map(u => (
              <TableRow key={u.id}>
                <TableCell>{u.nom}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>{u.role}</TableCell>
                <TableCell>{u.createdAt ? u.createdAt.slice(0, 10) : "-"}</TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" onClick={() => handleOpenEdit(u)}>Éditer</Button>
                  <Button variant="destructive" size="sm" onClick={() => setDeleteId(u.id)}>Supprimer</Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      {/* Pagination avancée */}
      <div className="flex flex-wrap justify-between items-center mt-4 gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Page {page} / {pageCount}</span>
          <Select value={String(pageSize)} onValueChange={v => { setPageSize(Number(v)); setPage(1); }}>
            <SelectTrigger className="w-24 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map(opt => (
                <SelectItem key={opt} value={String(opt)}>{opt} / page</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          {page > 1 && (
            <Button type="button" size="sm" variant="secondary" onClick={() => setPage(p => Math.max(1, p - 1))} aria-label="Page précédente">Précédent</Button>
          )}
          {page < pageCount && (
            <Button type="button" size="sm" variant="secondary" onClick={() => setPage(p => Math.min(pageCount, p + 1))} aria-label="Page suivante">Suivant</Button>
          )}
        </div>
        <span className="text-xs text-gray-500">{total} utilisateur{total > 1 ? "s" : ""}</span>
      </div>
      {/* Dialog ajout/édition */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogTitle>{editId ? "Modifier l'utilisateur" : "Ajouter un utilisateur"}</DialogTitle>
          <DialogDescription aria-describedby="Formulaire utilisateur">
            {editId ? "Modifiez les informations de l'utilisateur." : "Remplissez le formulaire pour ajouter un nouvel utilisateur."}
          </DialogDescription>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Nom</label>
                <Input name="nom" value={form.nom} onChange={handleFormChange} required />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Email</label>
                <Input name="email" value={form.email} onChange={handleFormChange} required type="email" autoComplete="email" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Rôle</label>
                <select name="role" value={form.role} onChange={handleFormChange} className="w-full border rounded px-3 py-2">
                  <option value="client">Client</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Mot de passe {editId ? <span className="text-gray-500">(laisser vide pour ne pas changer)</span> : null}</label>
                <Input name="password" value={form.password} onChange={handleFormChange} type="password" autoComplete="new-password" minLength={6} placeholder={editId ? "Nouveau mot de passe (optionnel)" : "Mot de passe (min 6 caractères)"} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={handleCloseDialog} disabled={submitting}>Annuler</Button>
              <Button type="submit" variant="default" disabled={submitting}>{editId ? "Enregistrer" : "Ajouter"}</Button>
            </DialogFooter>
            {feedback && <div className="text-sm text-center text-red-600 mt-2">{feedback}</div>}
          </form>
        </DialogContent>
      </Dialog>
      {/* Dialog suppression */}
      <Dialog open={!!deleteId} onOpenChange={open => { if (!open) setDeleteId(null); }}>
        <DialogContent>
          <DialogTitle>Supprimer l'utilisateur ?</DialogTitle>
          <div>Cette action est irréversible.</div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setDeleteId(null)} disabled={submitting}>Annuler</Button>
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={submitting}>Supprimer</Button>
          </DialogFooter>
          {feedback && <div className="text-sm text-center text-red-600 mt-2">{feedback}</div>}
        </DialogContent>
      </Dialog>
      {toast && (
        <div role="status" aria-live="polite" className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded shadow-lg animate-fade-in z-50">
          {toast}
          <button onClick={() => setToast("")} className="ml-4 text-white/80 hover:text-white font-bold">×</button>
        </div>
      )}
    </div>
  );
}
