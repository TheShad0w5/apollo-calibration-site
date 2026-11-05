// Only deliberate domain errors may be returned to the admin client.
// Database and unexpected programming failures remain server errors.
export class HardwareError extends Error {
  constructor(message,status=400){super(message);this.name='HardwareError';this.status=status;}
}
