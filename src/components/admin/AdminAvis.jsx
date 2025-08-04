import React, { useEffect, useState } from "react";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "../ui/table";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogTitle, DialogFooter } from "../ui/dialog";
import { Input } from "../ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "../ui/select";

export default function AdminAvis() {
  const [avis, setAvis] = useState([]);
  const [services, setServices] = useState([]);
  const [formations, setFormations] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [formationFilter, setFormationFilter] = useState("all");
  const [globalFilter, setGlobalFilter] = useState("all");
  const [servicesGlobalFilter, setServicesGlobalFilter] = useState("all");
  const [formationsGlobalFilter, setFormationsGlobalFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState("all");
  const [periodDate, setPeriodDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [openDialog, setOpenDialog] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ utilisateur: "", commentaire: "", note: 5, serviceId: "", formationId: "", global: 0 });
  const [deleteId, setDeleteId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/avis-db").then((r) => r.json()),
      fetch("/api/service-db").then((r) => r.json()),
      fetch("/api/formation-db").then((r) => r.json()).then(res => res.data),
      fetch("/api/utilisateur-db").then((r) => r.json()),
    ])
      .then(([avis, services, formations, users]) => {
        setAvis(avis);
        setServices(services);
        setFormations(formations);
        setUsers(users);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

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

  const filtered = avis.filter((a) => {
    if (serviceFilter !== "all" && String(a.serviceId) !== serviceFilter) return false;
    if (formationFilter !== "all" && String(a.formationId) !== formationFilter) return false;
    if (globalFilter !== "all" && String(a.global) !== globalFilter) return false;
    if (servicesGlobalFilter !== "all" && String(a.servicesGlobal) !== servicesGlobalFilter) return false;
    if (formationsGlobalFilter !== "all" && String(a.formationsGlobal) !== formationsGlobalFilter) return false;
    if (!isInPeriod(a.createdAt)) return false;
    if (search) {
      const user = users.find((u) => u.id == a.utilisateur);
      const service = services.find((s) => s.id == a.serviceId);
      const formation = formations.find((f) => f.id == a.formationId);
      return (
        a.utilisateur?.toLowerCase().includes(search.toLowerCase()) ||
        a.commentaire?.toLowerCase().includes(search.toLowerCase()) ||
        (user && (user.nom?.toLowerCase().includes(search.toLowerCase()) || user.email?.toLowerCase().includes(search.toLowerCase()))) ||
        (service && service.nom?.toLowerCase().includes(search.toLowerCase())) ||
        (formation && formation.titre?.toLowerCase().includes(search.toLowerCase()))
      );
    }
    return true;
  });

  const handleOpenAdd = () => {
    setEditId(null);
    setForm({ utilisateur: "", commentaire: "", note: 5, serviceId: "", global: 0 });
    setOpenDialog(true);
  };

  const handleOpenEdit = (a) => {
    setEditId(a.id);
    setForm({
      utilisateur: a.utilisateur,
      commentaire: a.commentaire,
      note: a.note,
      serviceId: a.serviceId || "",
      global: a.global || 0,
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditId(null);
    setForm({ utilisateur: "", commentaire: "", note: 5, serviceId: "", global: 0 });
    setFeedback("");
  };

  const handleFormChange = (e) => {
    const { name, value, type } = e.target;
    setForm((f) => ({ ...f, [name]: type === "number" ? Number(value) : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback("");
    try {
      const method = editId ? "PATCH" : "POST";
      const url = editId ? `/api/avis-db?id=${editId}` : "/api/avis-db";
      const payload = {
        ...form,
        note: Number(form.note),
        global: Number(form.global),
        serviceId: form.serviceId ? Number(form.serviceId) : null,
      };
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setFeedback(editId ? "Avis modifié !" : "Avis ajouté !");
        setAvis(await fetch("/api/avis-db").then((r) => r.json()));
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
      const res = await fetch(`/api/avis-db?id=${deleteId}`, { method: "DELETE" });
      if (res.ok) {
        setFeedback("Avis supprimé.");
        setAvis(await fetch("/api/avis-db").then((r) => r.json()));
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
  if (!avis) return <div className="text-center py-12 text-red-600">Erreur de chargement des avis.</div>;

  return (
    <div className="w-full max-w-6xl mx-auto px-2 md:px-0">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <h2 className="text-2xl font-bold">Avis</h2>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Input
            type="text"
            placeholder="Recherche... (auteur, contenu, service, email)"
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
          <label className="text-xs font-semibold">Type d’avis</label>
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
      <div className="overflow-x-auto rounded-lg shadow bg-white p-2 md:p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Auteur</TableHead>
              <TableHead>Note</TableHead>
              <TableHead>Contenu</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Formation</TableHead>
              <TableHead>Global</TableHead>
              <TableHead>Services Global</TableHead>
              <TableHead>Formations Global</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  Aucun avis
                </TableCell>
              </TableRow>
            ) : (
              [...filtered]
                .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
                .map((a) => {
                  const user = users.find((u) => u.id == a.utilisateur);
                  const service = services.find((s) => s.id == a.serviceId);
                  const formation = formations.find((f) => f.id == a.formationId);
                  return (
                    <TableRow key={a.id}>
                      <TableCell>{user ? `${user.nom} (${user.email})` : a.utilisateur}</TableCell>
                      <TableCell>{a.note ?? "-"}</TableCell>
                      <TableCell>{a.commentaire}</TableCell>
                      <TableCell>{service ? service.nom : <span className="text-gray-400">-</span>}</TableCell>
                      <TableCell>{formation ? formation.titre : <span className="text-gray-400">-</span>}</TableCell>
                      <TableCell>{a.global ? "Oui" : "Non"}</TableCell>
                      <TableCell>{a.servicesGlobal ? "Oui" : "Non"}</TableCell>
                      <TableCell>{a.formationsGlobal ? "Oui" : "Non"}</TableCell>
                      <TableCell>{a.createdAt ? a.createdAt.slice(0, 10) : "-"}</TableCell>
                      <TableCell className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleOpenEdit(a)}>
                          Éditer
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => setDeleteId(a.id)}>
                          Supprimer
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
            )}
          </TableBody>
        </Table>
      </div>
      {/* Dialog pour ajout/édition */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-lg w-full">
          <DialogTitle>{editId ? "Modifier l'avis" : "Ajouter un avis"}</DialogTitle>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="block font-semibold mb-1">Auteur</label>
                <Select
                  value={form.utilisateur || ""}
                  onValueChange={(value) => setForm((f) => ({ ...f, utilisateur: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un utilisateur" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={String(u.id)}>{u.nom} ({u.email})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <label className="block font-semibold mb-1">Service</label>
                <Select
                  value={form.serviceId || ""}
                  onValueChange={(value) => {
                    setForm((f) => ({ ...f, serviceId: value, global: 0, servicesGlobal: 0, formationsGlobal: 0 }));
                  }}
                  disabled={form.global === 1 || form.servicesGlobal === 1}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un service" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Aucun</SelectItem>
                    {services.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.nom}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <label className="block font-semibold mb-1">Formation</label>
                <Select
                  value={form.formationId || ""}
                  onValueChange={(value) => {
                    setForm((f) => ({ ...f, formationId: value, global: 0, servicesGlobal: 0, formationsGlobal: 0 }));
                  }}
                  disabled={form.global === 1 || form.formationsGlobal === 1}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir une formation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Aucune</SelectItem>
                    {formations.map((f) => (
                      <SelectItem key={f.id} value={String(f.id)}>{f.titre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <label className="block font-semibold mb-1">Note</label>
                <Input name="note" type="number" min={1} max={5} value={form.note} onChange={handleFormChange} required />
              </div>
            </div>
            <div>
              <label className="block font-semibold mb-1">Contenu</label>
              <Input name="commentaire" type="text" value={form.commentaire} onChange={handleFormChange} required />
            </div>
            <div>
              <label className="block font-semibold mb-1">Type d’avis</label>
              <div className="flex gap-2 items-center">
                <label className="flex items-center gap-1">
                  <input type="radio" name="globalTypeForm" value="global" checked={form.global === 1} onChange={() => setForm(f => ({ ...f, global: 1, servicesGlobal: 0, formationsGlobal: 0, serviceId: "", formationId: "" }))} /> Global
                </label>
                <label className="flex items-center gap-1">
                  <input type="radio" name="globalTypeForm" value="servicesGlobal" checked={form.servicesGlobal === 1} onChange={() => setForm(f => ({ ...f, global: 0, servicesGlobal: 1, formationsGlobal: 0, formationId: "" }))} /> Services global
                </label>
                <label className="flex items-center gap-1">
                  <input type="radio" name="globalTypeForm" value="formationsGlobal" checked={form.formationsGlobal === 1} onChange={() => setForm(f => ({ ...f, global: 0, servicesGlobal: 0, formationsGlobal: 1, serviceId: "" }))} /> Formations global
                </label>
              </div>
            </div>
            {feedback && <div className="text-sm text-center text-pink-700 font-semibold">{feedback}</div>}
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={handleCloseDialog}>
                Annuler
              </Button>
              <Button type="submit" variant="default" disabled={submitting}>
                {editId ? "Enregistrer" : "Ajouter"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* AlertDialog pour suppression */}
      <Dialog open={!!deleteId} onOpenChange={(v) => { if (!v) setDeleteId(null); }}>
        <DialogContent className="max-w-md w-full">
          <DialogTitle>Supprimer l'avis ?</DialogTitle>
          <div className="py-4">Cette action est irréversible. Confirmer la suppression ?</div>
          {feedback && <div className="text-sm text-center text-pink-700 font-semibold">{feedback}</div>}
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setDeleteId(null)}>
              Annuler
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={submitting}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
