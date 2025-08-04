import React, { useEffect, useState, useRef } from "react";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "../ui/table";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogTitle, DialogFooter } from "../ui/dialog";
import { Input } from "../ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "../ui/select";

// Pagination options
const PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100];

export default function AdminGalerie() {
  // Data
  const [galerie, setGalerie] = useState([]);
  const [services, setServices] = useState([]);
  const [formations, setFormations] = useState([]);
  const [loading, setLoading] = useState(true);
  // Filtres avancés
  const [search, setSearch] = useState("");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [formationFilter, setFormationFilter] = useState("all");
  const [globalFilter, setGlobalFilter] = useState("all");
  const [servicesGlobalFilter, setServicesGlobalFilter] = useState("all");
  const [formationsGlobalFilter, setFormationsGlobalFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState("all");
  const [periodDate, setPeriodDate] = useState(() => new Date().toISOString().slice(0, 10));
  // Dialogs & forms
  const [openDialog, setOpenDialog] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ title: "", imageUrl: "", alt: "", description: "", uploadedBy: "" });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [deleteId, setDeleteId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [toast, setToast] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sort, setSort] = useState({ key: "createdAt", dir: "desc" });
  const fileInputRef = useRef();

  // Fetch all data (galerie, services, formations)
  useEffect(() => {
    Promise.all([
      fetch("/api/galerie-db").then((r) => r.json()),
      fetch("/api/service-db").then((r) => r.json()),
      fetch("/api/formation-db").then((r) => r.json()).then(res => res.data),
    ])
      .then(([galerie, services, formations]) => {
        setGalerie(galerie);
        setServices(services);
        setFormations(formations);
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

  // Helpers
  function isInPeriod(dateStr) {
    if (periodFilter === "all") return true;
    if (!dateStr) return true;
    const d = new Date(dateStr);
    const ref = new Date(periodDate);
    if (isNaN(d) || isNaN(ref)) return true;
    if (periodFilter === "day") {
      return d.toISOString().slice(0, 10) === ref.toISOString().slice(0, 10);
    }
    if (periodFilter === "month") {
      return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
    }
    if (periodFilter === "year") {
      return d.getFullYear() === ref.getFullYear();
    }
    return true;
  }

  // Filtres avancés harmonisés avec AdminAvis
  const filtered = galerie.filter((g) => {
    if (serviceFilter !== "all" && String(g.serviceId) !== serviceFilter) return false;
    if (formationFilter !== "all" && String(g.formationId) !== formationFilter) return false;
    if (globalFilter !== "all" && String(g.global) !== globalFilter) return false;
    if (servicesGlobalFilter !== "all" && String(g.servicesGlobal) !== servicesGlobalFilter) return false;
    if (formationsGlobalFilter !== "all" && String(g.formationsGlobal) !== formationsGlobalFilter) return false;
    if (!isInPeriod(g.createdAt)) return false;
    if (search) {
      return (
        g.title?.toLowerCase().includes(search.toLowerCase()) ||
        g.description?.toLowerCase().includes(search.toLowerCase()) ||
        g.uploadedBy?.toLowerCase().includes(search.toLowerCase())
      );
    }
    return true;
  });

  // Tri dynamique
  const sorted = [...filtered].sort((a, b) => {
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

  // Pagination
  const total = sorted.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const paginated = sorted.slice((page - 1) * pageSize, page * pageSize);

  // Dialog helpers
  const handleOpenAdd = () => {
    setEditId(null);
    setForm({ title: "", imageUrl: "", alt: "", description: "", uploadedBy: "" });
    setImageFile(null);
    setImagePreview("");
    setOpenDialog(true);
    setFeedback("");
  };
  const handleOpenEdit = (g) => {
    setEditId(g.id);
    setForm({
      title: g.title,
      imageUrl: g.imageUrl || "",
      alt: g.alt || "",
      description: g.description,
      uploadedBy: g.uploadedBy || ""
    });
    setImageFile(null);
    setImagePreview(g.imageUrl || "");
    setOpenDialog(true);
    setFeedback("");
  };
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditId(null);
    setForm({ title: "", imageUrl: "", alt: "", description: "", uploadedBy: "" });
    setImageFile(null);
    setImagePreview("");
    setFeedback("");
  };

  // Upload/preview/validation unique
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
    setForm((f) => ({ ...f, imageUrl: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // CRUD
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setFeedback("");
    if (!form.title.trim()) { setFeedback("Le titre est obligatoire."); setSubmitting(false); return; }
    if (!form.alt.trim()) { setFeedback("Le texte alternatif (accessibilité) est obligatoire."); setSubmitting(false); return; }
    if (!form.description.trim()) { setFeedback("La description est obligatoire."); setSubmitting(false); return; }
    let imageUrl = form.imageUrl;
    // Upload image si nouvelle image sélectionnée
    if (imageFile) {
      const data = new FormData();
      data.append("file", imageFile);
      const uploadRes = await fetch("/api/upload-galerie-image", { method: "POST", body: data });
      if (uploadRes.ok) {
        const { filename } = await uploadRes.json();
        imageUrl = filename;
      } else {
        setFeedback("Erreur upload image");
        setSubmitting(false);
        return;
      }
    }
    try {
      const method = editId ? "PATCH" : "POST";
      const url = editId ? `/api/galerie-db?id=${editId}` : "/api/galerie-db";
      const payload = {
        ...form,
        imageUrl,
      };
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setToast(editId ? "Image modifiée !" : "Image ajoutée !");
        setGalerie(await fetch("/api/galerie-db").then((r) => r.json()));
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
      const res = await fetch(`/api/galerie-db?id=${deleteId}`, { method: "DELETE" });
      if (res.ok) {
        setFeedback("Image supprimée.");
        setGalerie(await fetch("/api/galerie-db").then((r) => r.json()));
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
  if (!galerie) return <div className="text-center py-12 text-red-600">Erreur de chargement de la galerie.</div>;

  return (
    <div className="w-full max-w-6xl mx-auto px-2 md:px-0">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <h2 className="text-2xl font-bold">Galerie</h2>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Input
            type="text"
            placeholder="Recherche... (titre, description, auteur)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <Button onClick={handleOpenAdd} variant="default" className="w-full sm:w-auto">
            Ajouter
          </Button>
        </div>
      </div>
      {/* Filtres avancés harmonisés */}
      <div className="flex flex-wrap gap-2 mb-4 items-center bg-gray-50 p-3 rounded-lg shadow-sm">
        <Button type="button" variant="secondary" onClick={() => {
          setServiceFilter("all");
          setFormationFilter("all");
          setGlobalFilter("all");
          setServicesGlobalFilter("all");
          setFormationsGlobalFilter("all");
          setPeriodFilter("all");
          setPeriodDate(new Date().toISOString().slice(0, 10));
          setSearch("");
        }}>
          Réinitialiser
        </Button>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold">Service</label>
          <Select value={serviceFilter} onValueChange={(v) => {
            setServiceFilter(v);
            if (v !== "all") {
              setGlobalFilter("0");
              setServicesGlobalFilter("0");
              setFormationsGlobalFilter("0");
            }
          }}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Tous les services" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les services</SelectItem>
              {services.map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>{s.nom}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold">Formation</label>
          <Select value={formationFilter} onValueChange={(v) => {
            setFormationFilter(v);
            if (v !== "all") {
              setGlobalFilter("0");
              setServicesGlobalFilter("0");
              setFormationsGlobalFilter("0");
            }
          }}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Toutes les formations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les formations</SelectItem>
              {formations.map((f) => (
                <SelectItem key={f.id} value={String(f.id)}>{f.titre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold">Type d’image</label>
          <div className="flex gap-2 items-center">
            <label className="flex items-center gap-1">
              <input type="radio" name="globalType" value="global" checked={globalFilter === "1"} onChange={() => {
                setGlobalFilter("1");
                setServicesGlobalFilter("all");
                setFormationsGlobalFilter("all");
                setServiceFilter("all");
                setFormationFilter("all");
              }} /> Global
            </label>
            <label className="flex items-center gap-1">
              <input type="radio" name="globalType" value="servicesGlobal" checked={servicesGlobalFilter === "1"} onChange={() => {
                setGlobalFilter("0");
                setServicesGlobalFilter("1");
                setFormationsGlobalFilter("all");
                setFormationFilter("all");
              }} /> Services global
            </label>
            <label className="flex items-center gap-1">
              <input type="radio" name="globalType" value="formationsGlobal" checked={formationsGlobalFilter === "1"} onChange={() => {
                setGlobalFilter("0");
                setServicesGlobalFilter("all");
                setFormationsGlobalFilter("1");
                setServiceFilter("all");
              }} /> Formations global
            </label>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold">Période</label>
          <Select value={periodFilter} onValueChange={setPeriodFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes dates</SelectItem>
              <SelectItem value="day">Jour</SelectItem>
              <SelectItem value="month">Mois</SelectItem>
              <SelectItem value="year">Année</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {periodFilter !== "all" && (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold">Date</label>
            <Input
              type="date"
              value={periodDate}
              onChange={(e) => setPeriodDate(e.target.value)}
              className="w-36"
              min="2000-01-01"
              max="2100-12-31"
            />
          </div>
        )}
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            {[
              { key: "title", label: "Titre" },
              { key: "description", label: "Description" },
              { key: "uploadedBy", label: "Auteur" },
              { key: "createdAt", label: "Date" },
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
              <TableCell colSpan={5}>Aucune image enregistrée.</TableCell>
            </TableRow>
          ) : (
            paginated.map((g) => (
              <TableRow key={g.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {/* Affiche jusqu’à 2 images (supporte images array ou fallback imageUrl) */}
                    {Array.isArray(g.images) && g.images.length > 0 ? (
                      g.images.slice(0, 2).map((img, idx) => (
                    <img key={img + idx} src={img} alt={g.alt || (g.title ? `Image galerie : ${g.title} (${idx + 1})` : `Image galerie ${idx + 1}`)} className="h-12 w-12 object-cover rounded shadow" />
                      ))
                    ) : g.imageUrl ? (
                  <img src={g.imageUrl} alt={g.alt || (g.title ? `Image galerie : ${g.title}` : "Image galerie")} className="h-12 w-12 object-cover rounded shadow" />
                    ) : null}
                    <span>{g.title}</span>
                  </div>
                </TableCell>
                <TableCell>{g.description}</TableCell>
                <TableCell>{g.uploadedBy}</TableCell>
                <TableCell>{g.createdAt ? g.createdAt.slice(0, 10) : "-"}</TableCell>
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
      <DialogTitle>{editId ? "Modifier l’image" : "Ajouter une image"}</DialogTitle>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold mb-1">Image</label>
            {(imageFile || imagePreview) ? (
              <div className="mb-2 flex items-center gap-2">
                <img src={imageFile ? imagePreview : (imagePreview ? imagePreview : undefined)} alt={form.alt || (form.title ? `Image galerie : ${form.title}` : "Image galerie")} className="h-16 rounded shadow" />
                <Button type="button" variant="destructive" size="sm" onClick={handleRemoveImage}>Supprimer</Button>
              </div>
            ) : null}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="block" aria-label="Image de la galerie" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Titre</label>
            <Input name="title" value={form.title} onChange={handleFormChange} required />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Texte alternatif (accessibilité)</label>
            <Input name="alt" value={form.alt} onChange={handleFormChange} required maxLength={180} placeholder="Ex : Maquillage mariée bohème à Annecy, ambiance champêtre, bouquet, robe fluide…" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Auteur</label>
            <Input name="uploadedBy" value={form.uploadedBy} onChange={handleFormChange} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold mb-1">Description</label>
            <Input name="description" value={form.description} onChange={handleFormChange} required />
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
          <DialogTitle>Supprimer l’image ?</DialogTitle>
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
