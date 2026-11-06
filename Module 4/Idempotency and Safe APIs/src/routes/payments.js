
'use strict';

// routes/payments.js

const router = require('express').Router();
const { charges, idempotency, nextChargeId } = require('../store');

router.post('/', (req, res) => {

  // Rule 1: Check whether the Idempotency-Key is missing
  const key = req.headers['idempotency-key'];

  if (!key) {
    return res.status(400).json({
      error: {
        code: 'IDEMPOTENCY_KEY_REQUIRED',
        message: 'Idempotency-Key header is required'
      }
    });
  }

  // Rule 2: If the key already exists, return the stored response
  if (idempotency.has(key)) {
    const storedResponse = idempotency.get(key);

    return res.status(storedResponse.status).json(storedResponse.body);
  }

  // Rule 3: Create a new charge for a new key
  const amount = req.body && req.body.amount;

  const charge = {
    id: nextChargeId(),
    amount,
    status: 'charged'
  };

  // Add the real charge
  charges.push(charge);

  // Store the complete response
  const response = {
    id: charge.id,
    amount: charge.amount,
    status: charge.status
  };

  idempotency.set(key, {
    status: 201,
    body: response
  });

  // Return the response
  return res.status(201).json(response);
});

module.exports = router;
