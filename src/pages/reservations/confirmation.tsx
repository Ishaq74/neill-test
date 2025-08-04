import React, { useEffect, useState } from 'react';
import Layout from '@layouts/Layout.astro';
import { useLocation } from 'react-router-dom';

type Reservation = {
  userId: string;
  serviceName?: string;
  formationName?: string;
  date: string;
  time: string;
  status: string;
};

const Confirmation: React.FC = () => {
  const location = useLocation();
  const [reservation, setReservation] = useState<Reservation | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    if (id) {
      fetch(`/api/reservation-db?id=${id}`)
        .then(res => res.json())
        .then(data => setReservation(data));
    }
  }, [location.search]);

  if (!reservation) {
    return <Layout><div className="container mx-auto py-12 text-center">Chargement du récapitulatif...</div></Layout>;
  }

  return (
    <Layout>
      <section className="container mx-auto py-12 max-w-xl">
        <div className="bg-white rounded-xl shadow p-8 text-center">
          <h1 className="text-3xl font-bold mb-4 text-pink-700">Réservation confirmée !</h1>
          <div className="mb-6 text-lg text-gray-700">Merci <b>{reservation.userId}</b> pour votre réservation.</div>
          <div className="mb-4">
            <b>Prestation :</b> {reservation.serviceName || reservation.formationName}<br />
            <b>Date :</b> {reservation.date} à {reservation.time}<br />
            <b>Statut :</b> {reservation.status}
          </div>
          <div className="bg-green-100 text-green-800 p-4 rounded mb-4">Un email de confirmation va vous être envoyé.</div>
          <a href="/" className="bg-pink-700 text-white px-6 py-3 rounded hover:bg-pink-800">Retour à l'accueil</a>
        </div>
      </section>
    </Layout>
  );
};

export default Confirmation;
