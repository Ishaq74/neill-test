import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Dialog, DialogContent, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';

// Formulaire de création de réservation (modale calendrier)
function ReservationCreateForm({ data, users, services, onClose, onCreate }) {
  const [form, setForm] = React.useState({
    userId: data.userId || '',
    serviceId: data.serviceId || '',
    date: data.date || '',
    time: data.time || '',
    status: data.status || 'pending',
    notes: data.notes || ''
  });
  const [submitting, setSubmitting] = React.useState(false);
  const [feedback, setFeedback] = React.useState('');
  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };
  const handleSelect = (name, value) => setForm(f => ({ ...f, [name]: value }));
  const handleSubmit = async e => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback('');
    try {
      const payload = {
        ...form,
        userId: form.userId ? Number(form.userId) : '',
        serviceId: form.serviceId ? Number(form.serviceId) : '',
      };
      const res = await fetch('/api/reservation-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const created = await res.json();
        setFeedback('Réservation créée !');
        onCreate(created);
      } else {
        setFeedback("Erreur lors de la création.");
      }
    } catch {
      setFeedback('Erreur réseau.');
    }
    setSubmitting(false);
  };
  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <label className="block font-semibold mb-1">Client</label>
          <select
            className="w-full rounded border px-2 py-1"
            name="userId"
            value={form.userId}
            onChange={handleChange}
            required
          >
            <option value="">Choisir...</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.nom} ({u.email})</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="block font-semibold mb-1">Service</label>
          <select
            className="w-full rounded border px-2 py-1"
            name="serviceId"
            value={form.serviceId}
            onChange={handleChange}
            required
          >
            <option value="">Choisir...</option>
            {services.map(s => (
              <option key={s.id} value={s.id}>{s.nom}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <label className="block font-semibold mb-1">Date</label>
          <input name="date" type="date" className="w-full rounded border px-2 py-1" value={form.date} onChange={handleChange} required />
        </div>
        <div className="flex-1">
          <label className="block font-semibold mb-1">Heure</label>
          <input name="time" type="time" className="w-full rounded border px-2 py-1" value={form.time} onChange={handleChange} required />
        </div>
        <div className="flex-1">
          <label className="block font-semibold mb-1">Statut</label>
          <select name="status" className="w-full rounded border px-2 py-1" value={form.status} onChange={handleChange} required>
            <option value="pending">En attente</option>
            <option value="confirmed">Confirmée</option>
            <option value="cancelled">Annulée</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block font-semibold mb-1">Notes (optionnel)</label>
        <input name="notes" type="text" className="w-full rounded border px-2 py-1" value={form.notes} onChange={handleChange} placeholder="Notes, précisions, etc." />
      </div>
      {feedback && <div className="text-sm text-center text-pink-700 font-semibold">{feedback}</div>}
      <DialogFooter>
        <Button type="button" variant="secondary" onClick={onClose}>Annuler</Button>
        <Button type="submit" variant="default" disabled={submitting}>Créer</Button>
      </DialogFooter>
    </form>
  );
}

export default function AdminCalendar() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null); // { type, data, eventObj }
  const [users, setUsers] = useState([]);
  const [services, setServices] = useState([]);

  // Chargement des réservations et utilisateurs/services pour enrichir les infos
  useEffect(() => {
    Promise.all([
      fetch('/api/reservation-db').then(res => res.json()),
      fetch('/api/admin-block').then(res => res.json()),
      fetch('/api/utilisateur-db').then(res => res.json()),
      fetch('/api/service-db').then(res => res.json())
    ])
      .then(([reservations, blocks, us, sv]) => {
        setUsers(us);
        setServices(sv);
        const reservationEvents = reservations.map(r => {
          const user = us.find(u => u.id === r.userId);
          const service = sv.find(s => s.id === r.serviceId);
          return {
            id: r.id,
            title: service ? service.nom : r.serviceName || `Réservation #${r.id}`,
            start: `${r.date}T${r.time}`,
            allDay: false,
            color: r.status === 'confirmed' ? '#22c55e' : r.status === 'cancelled' ? '#ef4444' : '#facc15',
            extendedProps: {
              ...r,
              userName: user ? user.nom : '',
              userEmail: user ? user.email : '',
              serviceName: service ? service.nom : '',
            }
          };
        });
        const blockEvents = blocks.map(b => ({
          id: `block-${b.id}`,
          title: b.title,
          start: b.start,
          end: b.end,
          allDay: !!b.allDay,
          color: '#a1a1aa',
          blocked: true,
          extendedProps: { blocked: true, ...b }
        }));
        setEvents([...reservationEvents, ...blockEvents]);
        setLoading(false);
      })
      .catch(e => { setError('Erreur de chargement'); setLoading(false); });
  }, []);


  // Ajout d'un créneau bloqué (admin) via modale
  const [blockDialog, setBlockDialog] = useState(false);
  const [blockInfo, setBlockInfo] = useState(null);
  const handleDateSelect = (selectInfo) => {
    setBlockInfo({ start: selectInfo.startStr, end: selectInfo.endStr, allDay: selectInfo.allDay });
    setBlockDialog(true);
  };

  // Clic sur événement : ouvrir modale harmonisée
  const handleEventClick = (clickInfo) => {
    const event = clickInfo.event;
    setModal({
      type: event.extendedProps.blocked ? 'block' : 'reservation',
      data: event.extendedProps,
      eventObj: event
    });
  };

  // Légende status
  const statusLegend = [
    { label: 'Confirmée', color: '#22c55e', key: 'confirmed' },
    { label: 'En attente', color: '#facc15', key: 'pending' },
    { label: 'Annulée', color: '#ef4444', key: 'cancelled' },
  ];

  // Ajout d'un état pour la modale de blocage manuelle
  const [manualBlockDialog, setManualBlockDialog] = useState(false);
  const [manualBlock, setManualBlock] = useState({ start: '', end: '', title: '' });

  // Ajout d'un état pour la modale de choix rapide
  const [quickAction, setQuickAction] = useState(null);

  if (loading) return <div className="text-center py-12">Chargement du calendrier...</div>;
  if (error) return <div className="text-center text-red-600 py-12">{error}</div>;

  return (
    <div className="bg-white rounded-xl shadow p-4">
      {/* Légende status */}
      <div className="flex gap-6 mb-4 items-center">
        {statusLegend.map(s => (
          <div key={s.key} className="flex items-center gap-2">
            <span className="inline-block w-4 h-4 rounded-full" style={{ background: s.color }}></span>
            <span className="text-xs text-gray-700">{s.label}</span>
          </div>
        ))}
        <Button variant="default" className="ml-auto" onClick={() => setManualBlockDialog(true)}>
          Bloquer un créneau
        </Button>
      </div>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        locale="fr"
        events={events}
        eventContent={renderEventContent}
        height={750}
        slotMinTime="08:00:00"
        slotMaxTime="21:00:00"
        eventMaxStack={3}
        eventDisplay="block"
        selectable={true}
        select={handleDateSelect}
        eventClick={handleEventClick}
        editable={true}
        eventDrop={async function(info) {
          // Drag & drop d'une réservation : PATCH API (date + heure précises)
          const { id, extendedProps, start } = info.event;
          if (extendedProps.blocked) return;
          const date = start.toISOString().slice(0, 10);
          const time = start.toTimeString().slice(0, 5);
          const payload = {
            ...extendedProps,
            date,
            time,
            userId: extendedProps.userId,
            serviceId: extendedProps.serviceId,
          };
          const res = await fetch(`/api/reservation-db?id=${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (res.ok) {
            const updated = await res.json();
            setEvents(evts => evts.map(e => e.id === updated.id ? {
              ...e,
              start: `${updated.date}T${updated.time}`,
              extendedProps: { ...e.extendedProps, ...updated }
            } : e));
          } else {
            info.revert();
            alert("Erreur lors du déplacement de la réservation.");
          }
        }}
        eventResize={async function(info) {
          // Resize d'une réservation : PATCH API (date + heure + durée)
          const { id, extendedProps, start, end } = info.event;
          if (extendedProps.blocked) return;
          const date = start.toISOString().slice(0, 10);
          const time = start.toTimeString().slice(0, 5);
          // Calculer la nouvelle durée en minutes
          let duration = 60;
          if (end && start) {
            duration = Math.round((end.getTime() - start.getTime()) / 60000);
          }
          const payload = {
            ...extendedProps,
            date,
            time,
            duration,
            userId: extendedProps.userId,
            serviceId: extendedProps.serviceId,
          };
          const res = await fetch(`/api/reservation-db?id=${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (res.ok) {
            const updated = await res.json();
            setEvents(evts => evts.map(e => e.id === updated.id ? {
              ...e,
              start: `${updated.date}T${updated.time}`,
              end: end ? end.toISOString() : undefined,
              extendedProps: { ...e.extendedProps, ...updated }
            } : e));
          } else {
            info.revert();
            alert("Erreur lors du redimensionnement de la réservation.");
          }
        }}
        // Désactivé : création rapide de blocage par clic (inutile, on garde seulement le bouton principal)
      />
      <div className="text-sm text-gray-500 mt-4">Cliquez sur une case pour bloquer un créneau, cliquez sur un événement pour voir le détail ou éditer.</div>

      {/* Modale harmonisée pour réservation ou blocage */}
      {modal && (
        <Dialog open={!!modal} onOpenChange={v => { if (!v) setModal(null); }}>
          <DialogContent className="max-w-lg w-full">
            <DialogTitle>
              {modal.type === 'reservation' ? 'Détail/édition réservation' : modal.type === 'reservation-create' ? 'Créer une réservation' : 'Créneau bloqué'}
            </DialogTitle>
            {modal.type === 'reservation' && typeof ReservationEditForm === 'function' && (
              <ReservationEditForm
                data={modal.data}
                users={users}
                services={services}
                onClose={() => setModal(null)}
                onUpdate={updated => {
                  setEvents(evts => evts.map(e => e.id === updated.id ? {
                    ...e,
                    start: `${updated.date}T${updated.time}`,
                    extendedProps: { ...e.extendedProps, ...updated }
                  } : e));
                  setModal(null);
                }}
                onDelete={deletedId => {
                  setEvents(evts => evts.filter(e => e.id !== deletedId));
                  setModal(null);
                }}
              />
            )}
            {modal.type === 'reservation-create' && (
              <ReservationCreateForm
                data={modal.data}
                users={users}
                services={services}
                onClose={() => setModal(null)}
                onCreate={created => {
                  setEvents(evts => ([
                    ...evts,
                    {
                      id: created.id,
                      title: services.find(s => s.id === created.serviceId)?.nom || 'Réservation',
                      start: `${created.date}T${created.time}`,
                      allDay: false,
                      color: created.status === 'confirmed' ? '#22c55e' : created.status === 'cancelled' ? '#ef4444' : '#facc15',
                      extendedProps: {
                        ...created,
                        userName: users.find(u => u.id === created.userId)?.nom || '',
                        userEmail: users.find(u => u.id === created.userId)?.email || '',
                        serviceName: services.find(s => s.id === created.serviceId)?.nom || '',
                      }
                    }
                  ]));
                  setModal(null);
                }}
              />
            )}
            {modal.type === 'block' && (
              <BlockEditForm
                data={modal.data}
                onClose={() => setModal(null)}
                onUpdate={updated => {
                  setEvents(evts => evts.map(e => e.id === `block-${updated.id}` ? {
                    ...e,
                    title: updated.title,
                    start: updated.start,
                    end: updated.end,
                    allDay: !!updated.allDay,
                    extendedProps: { ...e.extendedProps, ...updated }
                  } : e));
                  setModal(null);
                }}
                onDelete={deletedId => {
                  setEvents(evts => evts.filter(e => e.id !== `block-${deletedId}`));
                  setModal(null);
                }}
              />
            )}
          </DialogContent>
        </Dialog>
      )}
      {/* Modale ajout blocage */}
      <Dialog open={blockDialog} onOpenChange={setBlockDialog}>
        <DialogContent className="max-w-lg w-full">
          <DialogTitle>Bloquer un créneau</DialogTitle>
          {blockInfo && (
            <form onSubmit={async e => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const title = formData.get('title');
              if (!title) return;
              const newEvent = {
                title,
                start: blockInfo.start,
                end: blockInfo.end,
                allDay: blockInfo.allDay,
                blocked: true
              };
              try {
                const res = await fetch('/api/admin-block', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(newEvent)
                });
                let data;
                try {
                  data = await res.json();
                } catch {
                  data = null;
                }
                if (res.ok && data && data.id) {
                  setEvents(events => [
                    ...events,
                    { ...newEvent, id: `block-${data.id}`, extendedProps: { blocked: true, ...newEvent } }
                  ]);
                  setBlockDialog(false);
                } else {
                  alert('Erreur lors de la création du créneau bloqué.');
                }
              } catch {
                alert('Erreur réseau lors de la création du créneau bloqué.');
              }
            }} className="flex flex-col gap-4 mt-2">
              <Input name="title" placeholder="Motif ou nom du créneau" required />
              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setBlockDialog(false)}>Annuler</Button>
                <Button type="submit" variant="default">Bloquer</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
      {/* Modale de choix rapide */}
      {quickAction && (
        <Dialog open={!!quickAction} onOpenChange={v => { if (!v) setQuickAction(null); }}>
          <DialogContent className="max-w-sm w-full">
            <DialogTitle>Que souhaitez-vous faire ?</DialogTitle>
            <div className="flex flex-col gap-4 mt-2">
              <Button variant="default" onClick={() => {
                setModal({
                  type: 'reservation-create',
                  data: {
                    date: quickAction.date,
                    time: quickAction.time,
                    userId: '',
                    serviceId: '',
                    status: 'pending',
                    notes: ''
                  }
                });
                setQuickAction(null);
              }}>Créer une réservation</Button>
              <Button variant="secondary" onClick={() => {
                setBlockInfo({
                  start: quickAction.date + 'T' + quickAction.time,
                  end: null,
                  allDay: false
                });
                setBlockDialog(true);
                setQuickAction(null);
              }}>Bloquer un créneau</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
      <div className="text-sm text-gray-500 mt-4">Cliquez sur une case pour bloquer un créneau, cliquez sur un événement pour voir le détail ou éditer.</div>
    </div>
  );
}

// Formulaire d’édition de créneau bloqué (modale calendrier)
function BlockEditForm({ data, onClose, onUpdate, onDelete }) {
  const [form, setForm] = React.useState({
    title: data.title || '',
    start: data.start || '',
    end: data.end || '',
    allDay: !!data.allDay
  });
  useEffect(() => {
    setForm({
      title: data.title || '',
      start: data.start || '',
      end: data.end || '',
      allDay: !!data.allDay
    });
  }, [data]);
  const [submitting, setSubmitting] = React.useState(false);
  const [feedback, setFeedback] = React.useState('');
  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };
  const handleSubmit = async e => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback('');
    try {
      const payload = { ...form };
      const res = await fetch(`/api/admin-block?id=${data.id || data.blocked?.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setFeedback('Créneau modifié !');
        onUpdate({ ...payload, id: data.id || data.blocked?.id });
      } else {
        setFeedback("Erreur lors de la modification.");
      }
    } catch {
      setFeedback('Erreur réseau.');
    }
    setSubmitting(false);
  };
  const handleDelete = async () => {
    if (!window.confirm('Supprimer ce créneau ?')) return;
    setSubmitting(true);
    setFeedback('');
    try {
      const res = await fetch(`/api/admin-block?id=${data.id || data.blocked?.id}`, { method: 'DELETE' });
      if (res.ok) {
        setFeedback('Créneau supprimé.');
        onDelete(data.id || data.blocked?.id);
      } else {
        setFeedback('Erreur lors de la suppression.');
      }
    } catch {
      setFeedback('Erreur réseau.');
    }
    setSubmitting(false);
  };
  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
      <div>
        <label className="block font-semibold mb-1">Motif</label>
        <input name="title" type="text" className="w-full rounded border px-2 py-1" value={form.title} onChange={handleChange} required />
      </div>
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <label className="block font-semibold mb-1">Début</label>
          <input name="start" type="datetime-local" className="w-full rounded border px-2 py-1" value={form.start} onChange={handleChange} required />
        </div>
        <div className="flex-1">
          <label className="block font-semibold mb-1">Fin</label>
          <input name="end" type="datetime-local" className="w-full rounded border px-2 py-1" value={form.end} onChange={handleChange} />
        </div>
        <div className="flex items-center gap-2 mt-4 md:mt-0">
          <input name="allDay" type="checkbox" checked={form.allDay} onChange={handleChange} id="allDay" />
          <label htmlFor="allDay" className="font-semibold">Journée entière</label>
        </div>
      </div>
      {feedback && <div className="text-sm text-center text-pink-700 font-semibold">{feedback}</div>}
      <DialogFooter>
        <Button type="button" variant="destructive" onClick={handleDelete} disabled={submitting}>Supprimer</Button>
        <Button type="button" variant="secondary" onClick={onClose}>Annuler</Button>
        <Button type="submit" variant="default" disabled={submitting}>Enregistrer</Button>
      </DialogFooter>
    </form>
  );
}

// Affichage custom des événements (statut/couleur)
function renderEventContent(eventInfo) {
  // Affiche le nom du client ou la raison du blocage
  if (eventInfo.event.extendedProps.blocked) {
    return (
      <div className="flex items-center max-w-full overflow-hidden bg-black text-white px-2 py-1 rounded" style={{ minWidth: 0 }}>
        <span className="truncate max-w-[160px] font-medium" title={eventInfo.event.title}>{eventInfo.event.title}</span>
      </div>
    );
  }
  return (
    <div className="flex items-center max-w-full overflow-hidden" style={{ minWidth: 0 }}>
      <span className="truncate max-w-[160px] font-medium" title={eventInfo.event.extendedProps.userName || ''}>
        {eventInfo.event.extendedProps.userName || 'Client inconnu'}
      </span>
    </div>
  );
}
