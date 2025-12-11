const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

exports.handler = async (event, context) => {
  // Gestione pre-flight per CORS (sicurezza browser)
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Accettiamo solo richieste POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: 'Method Not Allowed' };
  }

  try {
    const { items } = JSON.parse(event.body);

    // Mappiamo i prodotti del carrello per Stripe
    // NOTA: Qui stiamo passando direttamente prezzo e nome.
    // In produzione reale, dovresti passare solo l'ID e recuperare il prezzo dal database per sicurezza.
    const lineItems = items.map((item) => ({
      price_data: {
        currency: 'gbp',
        product_data: {
          name: item.name,
          // images: ['https://tussito.com/images/' + item.image], // Opzionale
        },
        unit_amount: item.price, // Il prezzo è già in centesimi (es. 1200 per £12.00)
      },
      quantity: item.quantity,
    }));

    // Creiamo la sessione di pagamento
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${event.headers.origin}/success.html`,
      cancel_url: `${event.headers.origin}/menu.html`,
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ url: session.url }),
    };

  } catch (error) {
    console.error("Errore Stripe:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
