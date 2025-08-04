import React, { useEffect, useState } from 'react';
// Import shadcn/ui components (adapt to your alias if needed)

import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "../ui/table.jsx";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "../ui/select";
import { Input } from "../ui/input";

export default function AdminReservations() {
  // State
  const [reservations, setReservations] = useState([]);
  const [users, setUsers] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
// Dialog/modal states
const [openDialog, setOpenDialog] = useState(false); // add/edit
const [editId, setEditId] = useState(null); // id de la réservation à éditer
  const [form, setForm] = useState({
    userId: '',
    serviceId: '',
    date: '',
    time: '',
    status: 'pending',
    notes: '',
  });
const [deleteId, setDeleteId] = useState(null); // id à supprimer
const [submitting, setSubmitting] = useState(false);
const [feedback, setFeedback] = useState('');

  // Fetch all data on mount
  useEffect(() => {
    console.log('[AdminReservations] Fetching reservations, users, services...');
    Promise.all([
      fetch('/api/reservation-db').then(r => r.json()),
      fetch('/api/utilisateur-db').then(r => r.json()),
      fetch('/api/service-db').then(r => r.json())
    ])
      .then(([res, us, sv]) => {
        console.log('[AdminReservations] Reservations:', res);
        console.log('[AdminReservations] Users:', us);
        console.log('[AdminReservations] Services:', sv);
        setTimeout(() => {
          setReservations(res);
          setUsers(us);
          setServices(sv);
          setLoading(false);
        }, 1000); // 1s de latence simulée pour debug
      })
      .catch(e => {
        console.error('[AdminReservations] Error fetching data:', e);
        setLoading(false);
      });
  }, []);

  // Filtres avancés (service, statut, recherche)
  const [serviceFilter, setServiceFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  // Filtres période
  const [periodFilter, setPeriodFilter] = useState('all'); // all, day, week, month, year
  const [periodDate, setPeriodDate] = useState(() => new Date().toISOString().slice(0, 10)); // yyyy-mm-dd

  function isInPeriod(dateStr) {
    if (periodFilter === 'all') return true;
    const d = new Date(dateStr);
    const ref = new Date(periodDate);
    if (isNaN(d) || isNaN(ref)) return true;
    if (periodFilter === 'day') {
      return d.toISOString().slice(0, 10) === ref.toISOString().slice(0, 10);
    }
    if (periodFilter === 'week') {
      // ISO week: get Monday of week for both dates
      const getMonday = dt => { const t = new Date(dt); t.setDate(t.getDate() - ((t.getDay() + 6) % 7)); t.setHours(0,0,0,0); return t; };
      return getMonday(d).getTime() === getMonday(ref).getTime() && d.getFullYear() === ref.getFullYear();
    }
    if (periodFilter === 'month') {
      return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
    }
    if (periodFilter === 'year') {
      return d.getFullYear() === ref.getFullYear();
    }
    return true;
  }

  const filtered = reservations.filter(r => {
    // Filtre service
    if (serviceFilter !== 'all' && r.serviceId?.toString() !== serviceFilter) return false;
    // Filtre statut
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    // Filtre période
    if (!isInPeriod(r.date)) return false;
    // Recherche
    if (search) {
      const user = users.find(u => u.id === r.userId);
      const service = services.find(s => s.id === r.serviceId);
      return (
        r.id.toString().includes(search) ||
        (user && (user.nom?.toLowerCase().includes(search.toLowerCase()) || user.email?.toLowerCase().includes(search.toLowerCase()))) ||
        (service && service.nom?.toLowerCase().includes(search.toLowerCase()))
      );
    }
    return true;
  });


  // Handlers CRUD
  const handleOpenAdd = () => {
    setEditId(null);
    setForm({ userId: '', serviceId: '', date: '', time: '', status: 'pending', notes: '' });
    setOpenDialog(true);
  };

  const handleOpenEdit = (r) => {
    setEditId(r.id);
    setForm({
      userId: r.userId,
      serviceId: r.serviceId,
      date: r.date,
      time: r.time,
      status: r.status,
      notes: r.notes || '',
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditId(null);
    setForm({ userId: '', serviceId: '', date: '', time: '', status: 'pending', notes: '' });
    setFeedback('');
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback('');
    try {
      const method = editId ? 'PATCH' : 'POST';
      const url = editId ? `/api/reservation-db?id=${editId}` : '/api/reservation-db';
      // Cast userId et serviceId en number pour la compatibilité SQLite
      const payload = {
        ...form,
        userId: form.userId ? Number(form.userId) : '',
        serviceId: form.serviceId ? Number(form.serviceId) : '',
      };
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setFeedback(editId ? 'Réservation modifiée !' : 'Réservation ajoutée !');
        // Refresh
        const newRes = await fetch('/api/reservation-db').then(r => r.json());
        setReservations(newRes);
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
    setFeedback('');
    try {
      // Cast deleteId en number pour la compatibilité SQLite
      const idNum = Number(deleteId);
      const res = await fetch(`/api/reservation-db?id=${idNum}`, { method: 'DELETE' });
      if (res.ok) {
        setFeedback('Réservation supprimée.');
        setReservations(await fetch('/api/reservation-db').then(r => r.json()));
        setDeleteId(null);
      } else {
        setFeedback('Erreur lors de la suppression.');
      }
    } catch {
      setFeedback('Erreur réseau.');
    }
    setSubmitting(false);
  };

  if (loading) return <div className="text-center py-12">Chargement...</div>;

  if (!reservations || !users || !services) {
    return <div className="text-center py-12 text-red-600">Erreur de chargement des données.</div>;
  }


  // Dashboard avancé
  const now = new Date();
  const toDate = d => new Date(d.date + 'T' + (d.time || '00:00'));
  const future = filtered.filter(r => toDate(r) >= now);
  const past = filtered.filter(r => toDate(r) < now);
  const next = future.sort((a, b) => toDate(a) - toDate(b))[0];
  const last = past.sort((a, b) => toDate(b) - toDate(a))[0];
  // Aujourd'hui
  const todayStr = now.toISOString().slice(0, 10);
  const today = filtered.filter(r => r.date === todayStr);
  // Cette semaine (lundi-dimanche)
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7)); weekStart.setHours(0,0,0,0);
  const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6); weekEnd.setHours(23,59,59,999);
  const inWeek = filtered.filter(r => {
    const d = toDate(r);
    return d >= weekStart && d <= weekEnd;
  });
  // Ce mois
  const month = filtered.filter(r => {
    const d = toDate(r);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });
  // Top services
  const serviceCount = {};
  filtered.forEach(r => { if (r.serviceId) serviceCount[r.serviceId] = (serviceCount[r.serviceId] || 0) + 1; });
  const topServices = Object.entries(serviceCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id, count]) => {
      const s = services.find(s => s.id.toString() === id);
      return s ? `${s.nom} (${count})` : `Service #${id} (${count})`;
    });
  // Statut dominant
  const statusCount = {};
  filtered.forEach(r => { statusCount[r.status] = (statusCount[r.status] || 0) + 1; });
  const dominantStatus = Object.entries(statusCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
  // Alertes
  const alerts = [];
  const futureCancelled = future.filter(r => r.status === 'cancelled');
  if (futureCancelled.length) alerts.push(`${futureCancelled.length} réservation(s) annulée(s) à venir`);
  const futurePending = future.filter(r => r.status === 'pending');
  if (futurePending.length) alerts.push(`${futurePending.length} réservation(s) en attente à traiter`);

  return (
    <div className="w-full max-w-7xl mx-auto px-2 md:px-0">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <h2 className="text-2xl font-bold">Réservations</h2>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Input
            type="text"
            placeholder="Recherche... (nom, email, service)"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <Button onClick={handleOpenAdd} variant="default" className="w-full sm:w-auto">Ajouter</Button>
        </div>
      </div>

      {/* Dashboard avancé */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 mb-4">
        <div className="rounded-lg bg-blue-50 p-4 flex flex-col gap-1 shadow-sm min-h-[90px]">
          <span className="text-xs text-blue-700">Prochaine réservation</span>
          {next ? (
            <span className="font-bold text-base text-blue-900">{next.date} {next.time} — {(() => { const u = users.find(u => u.id === next.userId); return u ? u.nom : 'Client'; })()} ({(() => { const s = services.find(s => s.id === next.serviceId); return s ? s.nom : 'Service'; })()})</span>
          ) : <span className="text-gray-400">Aucune à venir</span>}
        </div>
        <div className="rounded-lg bg-gray-50 p-4 flex flex-col gap-1 shadow-sm min-h-[90px]">
          <span className="text-xs text-gray-500">Dernière passée</span>
          {last ? (
            <span className="font-bold text-base text-gray-800">{last.date} {last.time} — {(() => { const u = users.find(u => u.id === last.userId); return u ? u.nom : 'Client'; })()} ({(() => { const s = services.find(s => s.id === last.serviceId); return s ? s.nom : 'Service'; })()})</span>
          ) : <span className="text-gray-400">Aucune passée</span>}
        </div>
        <div className="rounded-lg bg-green-50 p-4 flex flex-col gap-1 shadow-sm min-h-[90px]">
          <span className="text-xs text-green-700">À venir</span>
          <span className="font-bold text-lg text-green-900">{future.length}</span>
          <span className="text-xs text-green-700">Aujourd’hui : {today.length} / Semaine : {inWeek.length} / Mois : {month.length}</span>
        </div>
        <div className="rounded-lg bg-pink-50 p-4 flex flex-col gap-1 shadow-sm min-h-[90px]">
          <span className="text-xs text-pink-700">Top services</span>
          {topServices.length ? topServices.map((s, i) => <span key={i} className="text-pink-900 text-sm">{i+1}. {s}</span>) : <span className="text-gray-400">Aucun</span>}
        </div>
        <div className="rounded-lg bg-yellow-50 p-4 flex flex-col gap-1 shadow-sm min-h-[90px] md:col-span-2 xl:col-span-1">
          <span className="text-xs text-yellow-700">Statut dominant</span>
          <span className="font-bold text-base text-yellow-900">{dominantStatus}</span>
        </div>
        <div className="rounded-lg bg-red-50 p-4 flex flex-col gap-1 shadow-sm min-h-[90px] md:col-span-2 xl:col-span-1">
          <span className="text-xs text-red-700">Alertes</span>
          {alerts.length ? alerts.map((a, i) => <span key={i} className="text-red-900 text-sm">{a}</span>) : <span className="text-gray-400">Aucune alerte</span>}
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg shadow bg-white p-2 md:p-4">
        {/* Filtres */}
        <div className="flex flex-wrap gap-2 mb-2 items-center">
          <Select value={periodFilter} onValueChange={value => setPeriodFilter(value)}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes dates</SelectItem>
              <SelectItem value="day">Jour</SelectItem>
              <SelectItem value="week">Semaine</SelectItem>
              <SelectItem value="month">Mois</SelectItem>
              <SelectItem value="year">Année</SelectItem>
            </SelectContent>
          </Select>
          {periodFilter !== 'all' && (
            <Input
              type="date"
              value={periodDate}
              onChange={e => setPeriodDate(e.target.value)}
              className="w-40"
              min="2000-01-01"
              max="2100-12-31"
            />
          )}
          <Select value={serviceFilter} onValueChange={value => setServiceFilter(value)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filtrer par service" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les services</SelectItem>
              {services.map(s => (
                <SelectItem key={s.id} value={s.id.toString()}>{s.nom}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={value => setStatusFilter(value)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filtrer par statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous statuts</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="confirmed">Confirmée</SelectItem>
              <SelectItem value="cancelled">Annulée</SelectItem>
            </SelectContent>
          </Select>
          {/* TODO: Ajout filtres période (semaine/mois) */}
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Heure</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center">Aucune réservation</TableCell></TableRow>
            ) : (
              [...filtered].sort((a, b) => b.date.localeCompare(a.date)).map(r => {
                const user = users.find(u => u.id === r.userId);
                const service = services.find(s => s.id === r.serviceId);
                return (
                  <TableRow key={r.id}>
                    <TableCell>{user ? `${user.nom} (${user.email})` : <span className="text-gray-400">Inconnu</span>}</TableCell>
                    <TableCell>{service ? service.nom : <span className="text-gray-400">Inconnu</span>}</TableCell>
                    <TableCell>{r.date}</TableCell>
                    <TableCell>{r.time}</TableCell>
                    <TableCell><Badge variant={r.status === 'confirmed' ? 'default' : r.status === 'cancelled' ? 'destructive' : 'secondary'}>{r.status}</Badge></TableCell>
                    <TableCell className="max-w-xs truncate" title={r.notes}>{r.notes || <span className="text-gray-400">-</span>}</TableCell>
                    <TableCell className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleOpenEdit(r)}>Éditer</Button>
                      <Button size="sm" variant="destructive" onClick={() => setDeleteId(r.id)}>Supprimer</Button>
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
          <DialogTitle>{editId ? 'Modifier la réservation' : 'Ajouter une réservation'}</DialogTitle>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="block font-semibold mb-1">Client</label>
                <Select
                  value={form.userId || ''}
                  onValueChange={value => setForm(f => ({ ...f, userId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un utilisateur" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(u => (
                      <SelectItem key={u.id} value={u.id.toString()}>{u.nom} ({u.email})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <label className="block font-semibold mb-1">Service</label>
                <Select
                  value={form.serviceId || ''}
                  onValueChange={value => setForm(f => ({ ...f, serviceId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un service" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map(s => (
                      <SelectItem key={s.id} value={s.id.toString()}>{s.nom}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="block font-semibold mb-1">Date</label>
                <Input name="date" type="date" value={form.date} onChange={handleFormChange} required />
              </div>
              <div className="flex-1">
                <label className="block font-semibold mb-1">Heure</label>
                <Input name="time" type="time" value={form.time} onChange={handleFormChange} required />
              </div>
              <div className="flex-1">
                <label className="block font-semibold mb-1">Statut</label>
                <Select
                  value={form.status || 'pending'}
                  onValueChange={value => setForm(f => ({ ...f, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="confirmed">Confirmée</SelectItem>
                    <SelectItem value="cancelled">Annulée</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="block font-semibold mb-1">Notes (optionnel)</label>
              <Input name="notes" type="text" value={form.notes} onChange={handleFormChange} placeholder="Notes, précisions, etc." />
            </div>
            {feedback && <div className="text-sm text-center text-pink-700 font-semibold">{feedback}</div>}
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={handleCloseDialog}>Annuler</Button>
              <Button type="submit" variant="default" disabled={submitting}>{editId ? 'Enregistrer' : 'Ajouter'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* AlertDialog pour suppression */}
      <Dialog open={!!deleteId} onOpenChange={v => { if (!v) setDeleteId(null); }}>
        <DialogContent className="max-w-md w-full">
          <DialogTitle>Supprimer la réservation ?</DialogTitle>
          <div className="py-4">Cette action est irréversible. Confirmer la suppression ?</div>
          {feedback && <div className="text-sm text-center text-pink-700 font-semibold">{feedback}</div>}
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setDeleteId(null)}>Annuler</Button>
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={submitting}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
