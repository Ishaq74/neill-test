import React from "react";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Dialog, DialogContent, DialogTitle, DialogFooter, DialogDescription } from "@components/ui/dialog";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@components/ui/table";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@components/ui/select";

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100];
const TAG_SUGGESTIONS = [
  "mariée", "shooting", "enfant", "soirée", "FX", "mode", "homme", "beauté", "artistique", "initiation"
];

export default function AdminFormations() {
  // State
  const [formations, setFormations] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [categorieFilter, setCategorieFilter] = React.useState("all");
  const [activeFilter, setActiveFilter] = React.useState("all");
  const [openDialog, setOpenDialog] = React.useState(false);
  const [editId, setEditId] = React.useState(null);
  const [form, setForm] = React.useState({
    titre: "",
    description: "",
    content: "",
    notes: "",
    prix: "",
    image: "",
    imageAlt: "",
    icon: "",
    categorie: "",
    tags: "",
    steps: "",
    duree: "",
    durationMinutes: "",
    slug: "",
    isActive: true,
    isFeatured: false,
    certification: ""
  });
  const [feedback, setFeedback] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [deleteId, setDeleteId] = React.useState(null);
  const [toast, setToast] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [sort, setSort] = React.useState({ key: "createdAt", dir: "desc" });
  const [total, setTotal] = React.useState(0);
  const [tagInput, setTagInput] = React.useState("");

  // Fetch formations
  const fetchFormations = React.useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      sort: sort.key,
      dir: sort.dir,
    });
    if (search) {
      params.append("search", search);
    }
    if (categorieFilter !== "all") params.append("categorie", categorieFilter);
    if (activeFilter !== "all") params.append("isActive", activeFilter);
    fetch(`/api/formation-db?${params.toString()}`)
      .then(r => r.json())
      .then(res => {
        setFormations(res.data || []);
        setTotal(res.total || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [page, pageSize, sort, search, categorieFilter, activeFilter]);

  React.useEffect(() => { fetchFormations(); }, [fetchFormations]);
  React.useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast("") , 2500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // Handlers
  const handleFormChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };
  const handleOpenAdd = () => {
    setEditId(null);
    setForm({
      titre: "",
      description: "",
      content: "",
      notes: "",
      prix: "",
      image: "",
      imageAlt: "",
      icon: "",
      categorie: "",
      tags: "",
      steps: "",
      duree: "",
      durationMinutes: "",
      slug: "",
      isActive: true,
      isFeatured: false,
      certification: ""
    });
    setOpenDialog(true);
    setFeedback("");
  };
  const handleOpenEdit = f => {
    setEditId(f.id);
    setForm({
      ...f,
      tags: Array.isArray(f.tags) ? f.tags.join(", ") : (f.tags || ""),
      steps: Array.isArray(f.steps) ? f.steps.join("\n") : (f.steps || ""),
      prix: f.prix || "",
      duree: f.duree || "",
      durationMinutes: f.durationMinutes || "",
      image: f.image || "",
      imageAlt: f.imageAlt || "",
      icon: f.icon || "",
      content: f.content || "",
      notes: f.notes || "",
      slug: f.slug || ""
    });
    setOpenDialog(true);
    setFeedback("");
  };
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditId(null);
    setFeedback("");
  };
  const handleSubmit = async e => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback("");
    const payload = {
      ...form,
      prix: parseFloat(form.prix),
      durationMinutes: form.durationMinutes ? parseInt(form.durationMinutes, 10) : null,
      tags: Array.isArray(form.tags) ? form.tags : form.tags.split(",").map(t => t.trim()).filter(Boolean),
      steps: form.steps.split("\n").map(s => s.trim()).filter(Boolean),
      isActive: !!form.isActive,
      isFeatured: !!form.isFeatured
    };
    try {
      const res = await fetch(`/api/formation-db`, {
        method: editId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editId ? { ...payload, id: editId } : payload)
      });
      if (res.ok) {
        setToast(editId ? "Formation modifiée !" : "Formation ajoutée !");
        setOpenDialog(false);
        fetchFormations();
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
      const res = await fetch(`/api/formation-db`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteId })
      });
      if (res.ok) {
        setToast("Formation supprimée !");
        setDeleteId(null);
        fetchFormations();
      } else {
        setFeedback("Erreur lors de la suppression.");
      }
    } catch {
      setFeedback("Erreur réseau.");
    }
    setSubmitting(false);
  };
  const handleAddTag = (e) => {
    if (e) e.preventDefault();
    const val = tagInput.trim();
    if (!val || (Array.isArray(form.tags) ? form.tags.includes(val) : form.tags.split(",").map(t => t.trim()).includes(val))) return;
    setForm(f => ({ ...f, tags: Array.isArray(f.tags) ? [...f.tags, val] : [val] }));
    setTagInput("");
  };
  const handleRemoveTag = (tag) => {
    setForm(f => ({ ...f, tags: Array.isArray(f.tags) ? f.tags.filter(t => t !== tag) : [] }));
  };

  // Table rendering
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="p-4">
      <div className="flex flex-wrap gap-2 justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Formations</h1>
        <Button onClick={handleOpenAdd}>Ajouter</Button>
      </div>
      <div className="flex flex-wrap gap-2 mb-4 items-end">
        <Input placeholder="Recherche (titre, description, catégorie, tags, content, notes)" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="w-64" />
        <div>
          <label className="block text-xs font-semibold mb-1">Catégorie</label>
          <Input name="categorieFilter" value={categorieFilter === "all" ? "" : categorieFilter} onChange={e => { setCategorieFilter(e.target.value || "all"); setPage(1); }} className="w-32" placeholder="Toutes" />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">Active</label>
          <Select value={activeFilter} onValueChange={v => { setActiveFilter(v); setPage(1); }}>
            <SelectTrigger className="w-24">
              <SelectValue placeholder="Toutes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              <SelectItem value="true">Oui</SelectItem>
              <SelectItem value="false">Non</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="cursor-pointer" onClick={() => setSort(s => ({ key: "titre", dir: s.key === "titre" && s.dir === "asc" ? "desc" : "asc" }))}>
              Titre {sort.key === "titre" ? (sort.dir === "asc" ? "▲" : "▼") : null}
            </TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Content</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead className="cursor-pointer" onClick={() => setSort(s => ({ key: "prix", dir: s.key === "prix" && s.dir === "asc" ? "desc" : "asc" }))}>
              Prix {sort.key === "prix" ? (sort.dir === "asc" ? "▲" : "▼") : null}
            </TableHead>
            <TableHead>Catégorie</TableHead>
            <TableHead>Durée</TableHead>
            <TableHead>Durée (min)</TableHead>
            <TableHead>Tags</TableHead>
            <TableHead>Steps</TableHead>
            <TableHead>Image</TableHead>
            <TableHead>Image Alt</TableHead>
            <TableHead>Icon</TableHead>
            <TableHead>Active</TableHead>
            <TableHead>Vedette</TableHead>
            <TableHead>Certification</TableHead>
            <TableHead>createdAt</TableHead>
            <TableHead>updatedAt</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow><TableCell colSpan={10}>Chargement…</TableCell></TableRow>
          ) : formations.length === 0 ? (
            <TableRow><TableCell colSpan={10}>Aucune formation.</TableCell></TableRow>
          ) : (
            formations.map(f => (
              <TableRow key={f.id}>
                <TableCell>{f.titre}</TableCell>
                <TableCell>{f.description}</TableCell>
                <TableCell>{f.content}</TableCell>
                <TableCell>{f.notes}</TableCell>
                <TableCell>{f.prix} €</TableCell>
                <TableCell>{f.categorie}</TableCell>
                <TableCell>{f.duree}</TableCell>
                <TableCell>{f.durationMinutes}</TableCell>
                <TableCell>{f.tags && f.tags.length > 0 ? f.tags.join(', ') : ''}</TableCell>
                <TableCell>{f.steps && f.steps.length > 0 ? f.steps.join(' | ') : ''}</TableCell>
                <TableCell>{f.image}</TableCell>
                <TableCell>{f.imageAlt}</TableCell>
                <TableCell>{f.icon}</TableCell>
                <TableCell>{f.isActive ? 'Oui' : 'Non'}</TableCell>
                <TableCell>{f.isFeatured ? 'Oui' : 'Non'}</TableCell>
                <TableCell>{f.certification || ''}</TableCell>
                <TableCell>{f.createdAt ? f.createdAt.slice(0, 10) : ''}</TableCell>
                <TableCell>{f.updatedAt ? f.updatedAt.slice(0, 10) : ''}</TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" onClick={() => handleOpenEdit(f)}>Éditer</Button>
                  <Button variant="destructive" size="sm" onClick={() => setDeleteId(f.id)}>Supprimer</Button>
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
            <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map(opt => <SelectItem key={opt} value={String(opt)}>{opt} / page</SelectItem>)}
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
        <span className="text-xs text-gray-500">{total} formation{total > 1 ? "s" : ""}</span>
      </div>
      {/* Dialog ajout/édition */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogTitle>{editId ? "Modifier la formation" : "Créer une formation"}</DialogTitle>
          <DialogDescription>
            {editId ? "Modifiez les informations de la formation." : "Remplissez le formulaire pour ajouter une nouvelle formation."}
          </DialogDescription>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Titre</label>
                <Input name="titre" value={form.titre} onChange={handleFormChange} required />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Description</label>
                <Input name="description" value={form.description} onChange={handleFormChange} required />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Contenu détaillé</label>
                <textarea name="content" value={form.content} onChange={handleFormChange} className="w-full border rounded px-3 py-2 min-h-[60px]" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Notes internes</label>
                <textarea name="notes" value={form.notes} onChange={handleFormChange} className="w-full border rounded px-3 py-2 min-h-[40px]" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Icon (nom ou URL)</label>
                <Input name="icon" value={form.icon} onChange={handleFormChange} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Tags</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {(Array.isArray(form.tags) ? form.tags : form.tags.split(",").map(t => t.trim()).filter(Boolean)).map((tag) => (
                    <span key={tag} className="inline-flex items-center bg-gray-200 rounded px-2 py-0.5 text-xs">
                      {tag}
                      <button type="button" className="ml-1 text-red-500 hover:text-red-700" onClick={() => handleRemoveTag(tag)} aria-label={`Supprimer ${tag}`}>×</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    placeholder="Ajouter un tag..."
                    list="formation-tag-suggestions"
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(e); } }}
                    aria-label="Ajouter un tag"
                  />
                  <Button type="button" size="sm" variant="secondary" onClick={handleAddTag}>Ajouter</Button>
                </div>
                <datalist id="formation-tag-suggestions">
                  {TAG_SUGGESTIONS.filter(t => !(Array.isArray(form.tags) ? form.tags : form.tags.split(",").map(t => t.trim())).includes(t)).map(t => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Étapes (une par ligne)</label>
                <textarea name="steps" value={form.steps} onChange={handleFormChange} className="w-full border rounded px-3 py-2 min-h-[60px]" placeholder="ex: Préparation\nApplication du fond de teint\nFinitions..." />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Durée</label>
                <Input name="duree" value={form.duree} onChange={handleFormChange} placeholder="ex: 2 jours, 3h, etc." />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Durée (minutes)</label>
                <Input name="durationMinutes" value={form.durationMinutes} onChange={handleFormChange} type="number" min="0" placeholder="ex: 120" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Slug</label>
                <Input name="slug" value={form.slug} onChange={handleFormChange} required />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Certification</label>
                <Input name="certification" value={form.certification} onChange={handleFormChange} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Image (URL)</label>
                <Input name="image" value={form.image} onChange={handleFormChange} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Texte alternatif image (accessibilité)</label>
                <Input name="imageAlt" value={form.imageAlt} onChange={handleFormChange} />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" name="isActive" checked={!!form.isActive} onChange={handleFormChange} id="isActive" />
                <label htmlFor="isActive" className="text-xs font-semibold">Active</label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" name="isFeatured" checked={!!form.isFeatured} onChange={handleFormChange} id="isFeatured" />
                <label htmlFor="isFeatured" className="text-xs font-semibold">Vedette</label>
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
          <DialogTitle>Supprimer la formation ?</DialogTitle>
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
