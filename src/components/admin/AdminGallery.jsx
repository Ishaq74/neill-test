import React, { useEffect, useState, useRef } from "react";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "../ui/table";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogTitle, DialogFooter } from "../ui/dialog";
import { Input } from "../ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "../ui/select";

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100];
const TAG_SUGGESTIONS = [
  "shooting", "backstage", "fx", "mode", "enfant", "mariée", "artistique", "studio", "festival"
];
export default function AdminGallery() {
  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearchRaw] = useState("");
  const [tagFilter, setTagFilter] = useState("all");
  const [activeFilter, setActiveFilterRaw] = useState("all");
  const setSearch = (v) => { setSearchRaw(v); setPage(1); };
  const setActiveFilter = (v) => { setActiveFilterRaw(v); setPage(1); };
  const [openDialog, setOpenDialog] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ titre: "", description: "", tags: [], images: [], slug: "", isActive: true, imageFiles: [] });
  const [tagInput, setTagInput] = useState("");
  const [imagePreviews, setImagePreviews] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [deleteId, setDeleteId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [toast, setToast] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const fileInputRef = useRef();

  useEffect(() => {
    fetch("/api/gallery-db")
      .then((r) => r.json())
      .then((data) => {
        setGallery(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast("") , 2500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // Tri dynamique
  const [sort, setSort] = useState({ key: "id", dir: "desc" });
  const sortedGallery = [...gallery].sort((a, b) => {
    const { key, dir } = sort;
    let va = a[key], vb = b[key];
    if (typeof va === "string") va = va.toLowerCase();
    if (typeof vb === "string") vb = vb.toLowerCase();
    if (va === undefined || va === null) va = "";
    if (vb === undefined || vb === null) vb = "";
    if (va < vb) return dir === "asc" ? -1 : 1;
    if (va > vb) return dir === "asc" ? 1 : -1;
    return 0;
  });

  // Filtrage
  const filtered = sortedGallery.filter((g) => {
    let tagsArr = Array.isArray(g.tags) ? g.tags : (typeof g.tags === "string" && g.tags ? (() => { try { return JSON.parse(g.tags); } catch { return []; } })() : []);
    if (tagFilter !== "all" && !tagsArr.includes(tagFilter)) return false;
    if (activeFilter !== "all" && String(g.isActive ? 1 : 0) !== activeFilter) return false;
    if (search) {
      return (
        g.titre?.toLowerCase().includes(search.toLowerCase()) ||
        g.description?.toLowerCase().includes(search.toLowerCase()) ||
        tagsArr.join(' ').toLowerCase().includes(search.toLowerCase())
      );
    }
    return true;
  });

  // Tags uniques pour filtre
  const allTags = Array.from(new Set(gallery.flatMap(g => {
    if (Array.isArray(g.tags)) return g.tags;
    if (typeof g.tags === "string" && g.tags) try { return JSON.parse(g.tags); } catch { return []; }
    return [];
  }).filter(Boolean)));

  // Pagination
  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  // Gestion tags dynamiques
  const handleAddTag = (e) => {
    e.preventDefault();
    const val = tagInput.trim();
    if (!val || form.tags.includes(val)) return;
    setForm((f) => ({ ...f, tags: [...f.tags, val] }));
    setTagInput("");
  };
  const handleRemoveTag = (tag) => {
    setForm((f) => ({ ...f, tags: f.tags.filter((t) => t !== tag) }));
  };

  // Gestion images dynamiques (ajout, preview, suppression)
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/avif"];
    let newFiles = [];
    let newPreviews = [];
    let error = "";
    for (const file of files) {
      if (!allowed.includes(file.type)) {
        error = "Format d'image non autorisé (jpg, png, webp, avif)";
        break;
      }
      if (file.size > 5 * 1024 * 1024) {
        error = "Image trop volumineuse (max 5 Mo)";
        break;
      }
    }
    if (error) {
      setFeedback(error);
      fileInputRef.current.value = "";
      return;
    }
    if (files.length + form.images.length > 10) {
      setFeedback("Maximum 10 images par galerie");
      fileInputRef.current.value = "";
      return;
    }
    newFiles = [...imageFiles, ...files];
    newPreviews = [...imagePreviews, ...files.map(f => URL.createObjectURL(f))];
    setImageFiles(newFiles);
    setImagePreviews(newPreviews);
    setForm(f => ({ ...f, images: [...f.images, ...files.map(f => f.name)] }));
  };
  const handleRemoveImage = (idx) => {
    setImageFiles(files => files.filter((_, i) => i !== idx));
    setImagePreviews(previews => previews.filter((_, i) => i !== idx));
    setForm(f => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Slugify utilitaire
  function slugify(str) {
    return str.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  // Ouvre le form d’ajout
  const handleOpenAdd = () => {
    setEditId(null);
    setForm({ titre: "", description: "", tags: [], images: [], slug: "", isActive: true });
    setTagInput("");
    setImageFiles([]);
    setImagePreviews([]);
    setOpenDialog(true);
    setFeedback("");
  };

  // Ouvre le form d’édition
  const handleOpenEdit = (g) => {
    setEditId(g.id);
    setForm({
      titre: g.titre,
      description: g.description,
      tags: Array.isArray(g.tags) ? g.tags : (typeof g.tags === "string" && g.tags ? JSON.parse(g.tags) : []),
      images: Array.isArray(g.images) ? g.images : (typeof g.images === "string" && g.images ? JSON.parse(g.images) : []),
      slug: g.slug || "",
      isActive: !!g.isActive
    });
    setTagInput("");
    setImageFiles([]);
    setImagePreviews([]);
    setOpenDialog(true);
    setFeedback("");
  };

  // Ferme le form
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditId(null);
    setForm({ titre: "", description: "", tags: [], images: [], slug: "", isActive: true });
    setTagInput("");
    setImageFiles([]);
    setImagePreviews([]);
    setFeedback("");
  };

  // Soumission du form (ajout/édition)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setFeedback("");
    if (!form.titre.trim()) { setFeedback("Le titre est obligatoire."); setSubmitting(false); return; }
    if (!form.slug.trim() || !/^[a-z0-9\-]+$/.test(form.slug)) { setFeedback("Slug invalide (lettres, chiffres, tirets)."); setSubmitting(false); return; }
    // Unicité slug (hors édition courante)
    const slugExists = gallery.some(g => g.slug === form.slug && g.id !== editId);
    if (slugExists) { setFeedback("Ce slug existe déjà, choisissez-en un autre."); setSubmitting(false); return; }
    // Upload images si besoin
    let uploadedImages = [...form.images];
    if (imageFiles.length > 0) {
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const data = new FormData();
        data.append("file", file);
        data.append("name", slugify(form.titre) + (imageFiles.length > 1 ? `-${i+1}` : ""));
        const uploadRes = await fetch("/api/upload-service-image", { method: "POST", body: data });
        if (uploadRes.ok) {
          const { filename } = await uploadRes.json();
          uploadedImages.push(filename);
        } else {
          setFeedback("Erreur upload image");
          setSubmitting(false);
          return;
        }
      }
    }
    const method = editId ? "PATCH" : "POST";
    const url = editId ? `/api/gallery-db?id=${editId}` : "/api/gallery-db";
    const payload = {
      ...form,
      images: uploadedImages,
      isActive: form.isActive ? 1 : 0,
    };
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setToast(editId ? "Galerie modifiée !" : "Galerie ajoutée !");
      setGallery(await fetch("/api/gallery-db").then((r) => r.json()));
      handleCloseDialog();
    } else {
      setFeedback("Erreur lors de l'enregistrement.");
    }
    setSubmitting(false);
  };

  // Suppression
  const handleDelete = async () => {
    if (!deleteId) return;
    setSubmitting(true);
    setFeedback("");
    const res = await fetch(`/api/gallery-db?id=${deleteId}`, { method: "DELETE" });
    if (res.ok) {
      setToast("Galerie supprimée.");
      setGallery(await fetch("/api/gallery-db").then((r) => r.json()));
      setDeleteId(null);
    } else {
      setFeedback("Erreur lors de la suppression.");
    }
    setSubmitting(false);
  };

  // Statistiques
  const stats = {
    total: gallery.length,
    actifs: gallery.filter(g => g.isActive).length
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-2 md:px-0">
      <div className="flex flex-wrap gap-4 mb-4 items-center bg-blue-50 p-3 rounded-lg shadow-sm">
        <span className="font-semibold">Total : {stats.total}</span>
        <span className="text-green-700">Actifs : {stats.actifs}</span>
      </div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <h2 className="text-2xl font-bold">Galerie</h2>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Input
            type="text"
            placeholder="Recherche... (titre, description, tag)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <Button onClick={handleOpenAdd} variant="default" className="w-full sm:w-auto">
            Ajouter
          </Button>
        </div>
      </div>
      {/* Filtres avancés */}
      <div className="flex flex-wrap gap-2 mb-4 items-center bg-gray-50 p-3 rounded-lg shadow-sm">
        <Button type="button" variant="secondary" onClick={() => {
          setTagFilter("all");
          setActiveFilter("all");
          setSearch("");
        }}>
          Réinitialiser
        </Button>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold">Tag</label>
          <Select value={tagFilter} onValueChange={setTagFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Tous les tags" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les tags</SelectItem>
              {allTags.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold">Actif</label>
          <Select value={activeFilter} onValueChange={setActiveFilter}>
            <SelectTrigger className="w-28">
              <SelectValue placeholder="Tous" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="1">Oui</SelectItem>
              <SelectItem value="0">Non</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            {[
              { key: "titre", label: "Titre" },
              { key: "description", label: "Description" },
              { key: "tags", label: "Tags" },
              { key: "images", label: "Images" },
              { key: "isActive", label: "Actif" },
              { key: "actions", label: "Actions" }
            ].map(col => (
              <TableHead
                key={col.key}
                onClick={() => col.key !== "actions" && setSort(s => ({ key: col.key, dir: s.key === col.key && s.dir === "asc" ? "desc" : "asc" }))}
                className={col.key !== "actions" ? "cursor-pointer select-none" : ""}
                aria-sort={sort.key === col.key ? (sort.dir === "asc" ? "ascending" : "descending") : undefined}
              >
                {col.label}
                {sort.key === col.key ? (sort.dir === "asc" ? " ▲" : " ▼") : null}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginated.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8}>Aucune entrée dans la galerie.</TableCell>
            </TableRow>
          ) : (
            paginated.map((g) => (
              <TableRow key={g.id}>
                <TableCell>{g.titre}</TableCell>
                <TableCell>{g.description}</TableCell>
                <TableCell>{Array.isArray(g.tags) ? g.tags.join(', ') : (typeof g.tags === "string" && g.tags ? (() => { try { return JSON.parse(g.tags).join(', '); } catch { return g.tags; } })() : "")}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {(Array.isArray(g.images) ? g.images : (typeof g.images === "string" && g.images ? (() => { try { return JSON.parse(g.images); } catch { return []; } })() : [])).map((img, i) => (
                      <img key={img + i} src={"/assets/" + img} alt="" className="h-10 w-10 object-cover rounded" />
                    ))}
                  </div>
                </TableCell>
                <TableCell>{g.isActive ? "Oui" : "Non"}</TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" onClick={() => handleOpenEdit(g)}>
                    Éditer
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => setDeleteId(g.id)}>
                    Supprimer
                  </Button>
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
        <span className="text-xs text-gray-500">{total} résultat{total > 1 ? "s" : ""}</span>
      </div>
      {/* Dialog ajout/édition */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogTitle>{editId ? "Modifier l'entrée" : "Ajouter à la galerie"}</DialogTitle>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Titre</label>
                <Input name="titre" value={form.titre} onChange={e => setForm(f => ({ ...f, titre: e.target.value, slug: (!f.slug || f.slug === slugify(f.titre)) ? slugify(e.target.value) : f.slug }))} required />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Slug (URL)</label>
                <Input name="slug" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} required pattern="[a-z0-9\-]+" />
                <span className="text-xs text-gray-400">Généré automatiquement, modifiable.</span>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold mb-1">Description</label>
                <Input name="description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required />
              </div>
              {/* Tags dynamiques */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold mb-1">Tags</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {form.tags.map((tag) => (
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
                    list="tag-suggestions-gallery"
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(e); } }}
                    aria-label="Ajouter un tag"
                  />
                  <Button type="button" size="sm" variant="secondary" onClick={handleAddTag}>Ajouter</Button>
                </div>
                <datalist id="tag-suggestions-gallery">
                  {TAG_SUGGESTIONS.filter(t => !form.tags.includes(t)).map(t => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
              </div>
              {/* Images dynamiques */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold mb-1">Images</label>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple onChange={handleImageChange} className="block" aria-label="Images de la galerie" />
                <div className="flex flex-wrap gap-2 mt-2">
                  {imagePreviews.map((src, idx) => (
                    <span key={src} className="relative inline-block">
                      <img src={src} alt="Preview" className="h-16 w-16 object-cover rounded shadow" />
                      <button type="button" className="absolute top-0 right-0 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs" onClick={() => handleRemoveImage(idx)} aria-label="Supprimer l'image">×</button>
                    </span>
                  ))}
                  {/* Images déjà uploadées (édition) */}
                  {editId && form.images && form.images.length > 0 && form.images.filter(img => !imagePreviews.some(pre => pre.endsWith(img))).map((img, idx) => (
                    <span key={img} className="relative inline-block">
                      <img src={"/assets/" + img} alt="" className="h-16 w-16 object-cover rounded shadow" />
                    </span>
                  ))}
                </div>
                <span className="text-xs text-gray-400 block mt-1">Formats acceptés : jpg, png, webp, avif. 5 Mo max/image. 10 images max.</span>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" name="isActive" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} id="isActiveGallery" />
                <label htmlFor="isActiveGallery" className="text-xs">Actif</label>
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
      <Dialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <DialogContent>
          <DialogTitle>Supprimer cette entrée ?</DialogTitle>
          <div>Cette action est irréversible.</div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setDeleteId(null)} disabled={submitting}>Annuler</Button>
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={submitting}>Supprimer</Button>
          </DialogFooter>
          {feedback && <div className="text-sm text-center text-red-600 mt-2">{feedback}</div>}
        </DialogContent>
      </Dialog>
      {/* Toast simple pour feedback animé */}
      {toast && (
        <div role="status" aria-live="polite" className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded shadow-lg animate-fade-in z-50">
          {toast}
          <button onClick={() => setToast("")} className="ml-4 text-white/80 hover:text-white font-bold">×</button>
        </div>
      )}
    </div>
  );
}
