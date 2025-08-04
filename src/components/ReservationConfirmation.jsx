import React, { useEffect, useState } from 'react';

export default function ReservationConfirmation() {
  const [reservation, setReservation] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id) {
      console.log('[Confirmation] Fetching reservation for id:', id);
      fetch(`/api/reservation-db?id=${id}`)
        .then(res => res.json())
        .then(data => {
          console.log('[Confirmation] Reservation data:', data);
          // Test de latence artificielle pour debug UX
          setTimeout(() => {
            setReservation(data);
            if (data && data.userId) {
              fetch(`/api/utilisateur-db`).then(r => r.json()).then(users => {
                const u = users.find(u => String(u.id) === String(data.userId));
                console.log('[Confirmation] User data:', u);
                setUser(u);
              });
            }
          }, 1000); // 1s de latence simulée
        })
        .catch(e => {
          console.error('[Confirmation] Error fetching reservation:', e);
        });
    }
  }, []);

  if (!reservation) {
    return <div className="container mx-auto py-12 text-center">Chargement du récapitulatif...</div>;
  }

  // Affichage complet, sans id technique
  return (
    <section className="container mx-auto py-12 max-w-xl">
      <div className="bg-white rounded-xl shadow p-8 text-center">
        <h1 className="text-3xl font-bold mb-4 text-pink-700">Réservation confirmée !</h1>
        <div className="mb-6 text-lg text-gray-700">
          <b>Merci {user ? `${user.nom}` : ''} pour votre réservation !</b><br />
          {user && <span className="text-sm text-gray-500">{user.email}</span>}
        </div>
        <div className="mb-4 text-left max-w-md mx-auto">
          <div><b>Service :</b> {reservation.serviceName || reservation.formationName || <span className="text-gray-400">Non renseigné</span>}</div>
          <div><b>Date :</b> {reservation.date || <span className="text-gray-400">-</span>} à {reservation.time || <span className="text-gray-400">-</span>}</div>
          <div><b>Statut :</b> <span className={
            reservation.status === 'confirmed' ? 'text-green-700 font-semibold' :
            reservation.status === 'cancelled' ? 'text-red-700 font-semibold' :
            'text-yellow-700 font-semibold'
          }>{reservation.status}</span></div>
          {reservation.notes && <div><b>Notes :</b> {reservation.notes}</div>}
        </div>
        <div className="bg-green-100 text-green-800 p-4 rounded mb-4">Un email de confirmation va vous être envoyé.</div>
        <a href="/" className="bg-pink-700 text-white px-6 py-3 rounded hover:bg-pink-800">Retour à l'accueil</a>
      </div>
    </section>
  );
}
