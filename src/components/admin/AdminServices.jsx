import React, { useEffect, useState, useRef } from "react";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "../ui/table";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogTitle, DialogFooter } from "../ui/dialog";
import { Input } from "../ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "../ui/select";

// Pagination options (toujours visible)
const PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100];
// Tags suggérés pour autocomplétion (à adapter selon le contexte réel)
const TAG_SUGGESTIONS = [
  "mariée", "shooting", "enfant", "soirée", "FX", "mode", "homme", "beauté", "artistique", "initiation"
];
export default function AdminServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearchRaw] = useState("");
  // Filtre par tag (remplace l'ancien filtre catégorie)
  const [tagFilter, setTagFilter] = useState("all");
  const [activeFilter, setActiveFilterRaw] = useState("all");
  const [featuredFilter, setFeaturedFilterRaw] = useState("all");

  // Helpers pour reset page à 1 sur changement de filtre/recherche
  const setSearch = (v) => { setSearchRaw(v); setPage(1); };
  // plus de setCategorieFilter
  const setActiveFilter = (v) => { setActiveFilterRaw(v); setPage(1); };
  const setFeaturedFilter = (v) => { setFeaturedFilterRaw(v); setPage(1); };
  const [openDialog, setOpenDialog] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ nom: "", description: "", prix: 0, duree: "", isActive: true, isFeatured: false, image: "", imageAlt: "", tags: [], steps: [], slug: "", imageName: "" });
  const [stepInput, setStepInput] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [deleteId, setDeleteId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [toast, setToast] = useState("");
  const [page, setPage] = useState(1); // <-- pagination hook bien placé
  const [pageSize, setPageSize] = useState(10);
  const fileInputRef = useRef();

  useEffect(() => {
    fetch("/api/service-db")
      .then((r) => r.json())
      .then((data) => {
        setServices(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Fermer le toast après 2,5s
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast("") , 2500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // Tri dynamique
  const [sort, setSort] = useState({ key: "nom", dir: "asc" });
  const sortedServices = [...services].sort((a, b) => {
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

  const filtered = sortedServices.filter((s) => {
    // Supporte tags string ou array pour le filtrage
    let tagsArr = Array.isArray(s.tags) ? s.tags : (typeof s.tags === "string" && s.tags ? (() => { try { return JSON.parse(s.tags); } catch { return []; } })() : []);
    if (tagFilter !== "all" && !tagsArr.includes(tagFilter)) return false;
    if (activeFilter !== "all" && String(s.isActive ? 1 : 0) !== activeFilter) return false;
    if (featuredFilter !== "all" && String(s.isFeatured ? 1 : 0) !== featuredFilter) return false;
    if (search) {
      return (
        s.nom?.toLowerCase().includes(search.toLowerCase()) ||
        s.description?.toLowerCase().includes(search.toLowerCase()) ||
        tagsArr.join(' ').toLowerCase().includes(search.toLowerCase())
      );
    }
    return true;
  });

  const handleOpenAdd = () => {
    setEditId(null);
    setForm({ nom: "", description: "", prix: 0, duree: "", isActive: true, isFeatured: false, image: "", imageAlt: "", tags: [], steps: [], slug: "" });
    setTagInput("");
    setStepInput("");
    setImageFile(null);
    setImagePreview("");
    setOpenDialog(true);
  };

  const handleOpenEdit = (s) => {
    setEditId(s.id);
    setForm({
      nom: s.nom,
      description: s.description,
      prix: s.prix,
      duree: s.duree || "",
      isActive: !!s.isActive,
      isFeatured: !!s.isFeatured,
      image: s.image || "",
      imageAlt: s.imageAlt || "",
      tags: Array.isArray(s.tags) ? s.tags : (typeof s.tags === "string" && s.tags ? JSON.parse(s.tags) : []),
      steps: Array.isArray(s.steps) ? s.steps : (typeof s.steps === "string" && s.steps ? JSON.parse(s.steps) : []),
      slug: s.slug || ""
    });
    setTagInput("");
    setStepInput("");
    setImageFile(null);
    setImagePreview(s.image ? `/assets/${s.image.replace(/^.*[\\/]/, "")}` : "");
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditId(null);
    setForm({ nom: "", description: "", prix: 0, duree: "", isActive: true, isFeatured: false, image: "", imageAlt: "", tags: [], steps: [] });
    setTagInput("");
    setStepInput("");
    setImageFile(null);
    setImagePreview("");
    setFeedback("");
  };
  // Gestion steps dynamiques
  const handleAddStep = (e) => {
    e.preventDefault();
    const val = stepInput.trim();
    if (!val || form.steps.includes(val)) return;
    setForm((f) => ({ ...f, steps: [...f.steps, val] }));
    setStepInput("");
  };
  const handleRemoveStep = (step) => {
    setForm((f) => ({ ...f, steps: f.steps.filter((s) => s !== step) }));
  };
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
  // Gestion image upload/preview/suppression
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowed = ["image/jpeg", "image/png", "image/webp", "image/avif"];
      if (!allowed.includes(file.type)) {
        setFeedback("Format d'image non autorisé (jpg, png, webp, avif)");
        fileInputRef.current.value = "";
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setFeedback("Image trop volumineuse (max 5 Mo)");
        fileInputRef.current.value = "";
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };
  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview("");
    setForm((f) => ({ ...f, image: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Slugify utilitaire
  function slugify(str) {
    return str
      .toLowerCase()
      .normalize('NFD').replace(/\p{Diacritic}/gu, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => {
      if (name === "nom") {
        // Slug auto si pas modifié manuellement
        if (!f.slug || f.slug === slugify(f.nom)) {
          return { ...f, nom: value, slug: slugify(value) };
        }
      }
      if (name === "imageName") {
        // Slugifie le nom de l’image à la saisie
        return { ...f, imageName: slugify(value) };
      }
      return { ...f, [name]: type === "checkbox" ? checked : type === "number" ? Number(value) : value };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setFeedback("");
    // Validation stricte
    if (!form.nom.trim()) { setFeedback("Le nom est obligatoire."); setSubmitting(false); return; }
    if (!form.slug.trim() || !/^[a-z0-9\-]+$/.test(form.slug)) { setFeedback("Slug invalide (lettres, chiffres, tirets)."); setSubmitting(false); return; }
    if (form.prix <= 0) { setFeedback("Le prix doit être supérieur à 0."); setSubmitting(false); return; }
    // Unicité slug (hors édition courante)
    const slugExists = services.some(s => s.slug === form.slug && s.id !== editId);
    if (slugExists) { setFeedback("Ce slug existe déjà, choisissez-en un autre."); setSubmitting(false); return; }
    try {
      let imageName = form.image;
      // Si nouvelle image sélectionnée, upload
      if (imageFile) {
        const data = new FormData();
        data.append("file", imageFile);
        if (form.imageName) data.append("name", form.imageName);
        const uploadRes = await fetch("/api/upload-service-image", { method: "POST", body: data });
        if (uploadRes.ok) {
          const { filename } = await uploadRes.json();
          imageName = filename;
        } else {
          setFeedback("Erreur upload image");
          setSubmitting(false);
          return;
        }
      }
      const method = editId ? "PATCH" : "POST";
      const url = editId ? `/api/service-db?id=${editId}` : "/api/service-db";
      const payload = {
        ...form,
        image: imageName,
        isActive: form.isActive ? 1 : 0,
        isFeatured: form.isFeatured ? 1 : 0,
      };
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setToast(editId ? "Service modifié !" : "Service ajouté !");
        setServices(await fetch("/api/service-db").then((r) => r.json()));
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
      const res = await fetch(`/api/service-db?id=${deleteId}`, { method: "DELETE" });
      if (res.ok) {
        setFeedback("Service supprimé.");
        setServices(await fetch("/api/service-db").then((r) => r.json()));
        setDeleteId(null);
      } else {
        setFeedback("Erreur lors de la suppression.");
      }
    } catch {
      setFeedback("Erreur réseau.");
    }
    setSubmitting(false);
  };

  if (loading) return <div className="text-center py-12">Chargement...</div>;
  if (!services) return <div className="text-center py-12 text-red-600">Erreur de chargement des services.</div>;

  // Récupération des tags uniques pour le filtre (robuste string/array)
  const s = Array.from(new Set(services.flatMap(s => {
    if (Array.isArray(s.tags)) return s.tags;
    if (typeof s.tags === "string" && s.tags) try { return JSON.parse(s.tags); } catch { return []; }
    return [];
  }).filter(Boolean)));

  // Statistiques
  const stats = {
    total: services.length,
    actifs: services.filter(s => s.isActive).length,
    vedettes: services.filter(s => s.isFeatured).length
  };

  // Pagination
  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="w-full max-w-6xl mx-auto px-2 md:px-0">
      {/* Résumé/statistiques */}
      <div className="flex flex-wrap gap-4 mb-4 items-center bg-blue-50 p-3 rounded-lg shadow-sm">
        <span className="font-semibold">Total : {stats.total}</span>
        <span className="text-green-700">Actifs : {stats.actifs}</span>
        <span className="text-yellow-700">Vedettes : {stats.vedettes}</span>
      </div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <h2 className="text-2xl font-bold">Services</h2>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Input
            type="text"
            placeholder="Recherche... (nom, description, tag)"
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
          setFeaturedFilter("all");
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
              {s.map((cat) => (
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
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold">Vedette</label>
          <Select value={featuredFilter} onValueChange={setFeaturedFilter}>
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
              { key: "nom", label: "Nom" },
              { key: "description", label: "Description" },
              { key: "prix", label: "Prix" },
              { key: "tags", label: "Tags" },
              { key: "duree", label: "Durée" },
              { key: "isActive", label: "Active" },
              { key: "isFeatured", label: "Vedette" },
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
              <TableCell colSpan={8}>Aucun service enregistré.</TableCell>
            </TableRow>
          ) : (
            paginated.map((s) => (
              <TableRow key={s.id}>
                <TableCell>{s.nom}</TableCell>
                <TableCell>{s.description}</TableCell>
                <TableCell>{s.prix} €</TableCell>
                <TableCell>{Array.isArray(s.tags) ? s.tags.join(', ') : (typeof s.tags === "string" && s.tags ? (() => { try { return JSON.parse(s.tags).join(', '); } catch { return s.tags; } })() : "")}</TableCell>
                <TableCell>{s.duree || (s.durationMinutes ? s.durationMinutes + " min" : "")}</TableCell>
                <TableCell>{s.isActive ? "Oui" : "Non"}</TableCell>
                <TableCell>{s.isFeatured ? "Oui" : "Non"}</TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" onClick={() => handleOpenEdit(s)}>
                    Éditer
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => setDeleteId(s.id)}>
                    Supprimer
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      {/* Pagination avancée : toujours visible, boutons conditionnels */}
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
          <DialogTitle>{editId ? "Modifier le service" : "Ajouter un service"}</DialogTitle>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Steps dynamiques */}
      <div className="md:col-span-2">
        <label className="block text-xs font-semibold mb-1">Étapes du service</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {form.steps.map((step, idx) => (
            <span key={step + idx} className="inline-flex items-center bg-blue-100 rounded px-2 py-0.5 text-xs">
              {step}
              <button type="button" className="ml-1 text-red-500 hover:text-red-700" onClick={() => handleRemoveStep(step)} aria-label={`Supprimer ${step}`}>×</button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={stepInput}
            onChange={e => setStepInput(e.target.value)}
            placeholder="Ajouter une étape..."
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddStep(e); } }}
            aria-label="Ajouter une étape"
          />
          <Button type="button" size="sm" variant="secondary" onClick={handleAddStep}>Ajouter</Button>
        </div>
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
            list="tag-suggestions"
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(e); } }}
            aria-label="Ajouter un tag"
          />
          <Button type="button" size="sm" variant="secondary" onClick={handleAddTag}>Ajouter</Button>
        </div>
        <datalist id="tag-suggestions">
          {TAG_SUGGESTIONS.filter(t => !form.tags.includes(t)).map(t => (
            <option key={t} value={t} />
          ))}
        </datalist>
      </div>
              {/* Image upload/preview */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold mb-1">Image</label>
                {(imageFile || imagePreview) ? (
                  <div className="mb-2 flex items-center gap-2">
                    <img src={imageFile ? imagePreview : (imagePreview ? imagePreview : undefined)} alt="Preview" className="h-16 rounded shadow" />
                    <Button type="button" variant="destructive" size="sm" onClick={handleRemoveImage}>Supprimer</Button>
                  </div>
                ) : null}
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="block" aria-label="Image du service" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Nom de l’image (optionnel, sans extension)</label>
                <Input name="imageName" value={form.imageName} onChange={handleFormChange} placeholder="ex: shooting-mode-ete" />
                <span className="text-xs text-gray-400">Le nom sera utilisé pour le fichier uploadé (slugifié).</span>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Texte alternatif (accessibilité)</label>
                <Input name="imageAlt" value={form.imageAlt} onChange={handleFormChange} placeholder="Description de l'image" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Nom</label>
                <Input name="nom" value={form.nom} onChange={handleFormChange} required />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Slug (URL)</label>
                <Input name="slug" value={form.slug} onChange={handleFormChange} required pattern="[a-z0-9\-]+" />
                <span className="text-xs text-gray-400">Généré automatiquement, modifiable.</span>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Prix (€)</label>
                <Input name="prix" type="number" value={form.prix} onChange={handleFormChange} required min={0} step={0.01} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold mb-1">Description</label>
                <Input name="description" value={form.description} onChange={handleFormChange} required />
              </div>
              {/* label Tag supprimé car inutile */}
              <div>
                <label className="block text-xs font-semibold mb-1">Durée</label>
                <Input name="duree" value={form.duree} onChange={handleFormChange} />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleFormChange} id="isActive" />
                <label htmlFor="isActive" className="text-xs">Actif</label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" name="isFeatured" checked={form.isFeatured} onChange={handleFormChange} id="isFeatured" />
                <label htmlFor="isFeatured" className="text-xs">Vedette</label>
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
          <DialogTitle>Supprimer le service ?</DialogTitle>
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
