export function eventRegistrationSuccessMessage(register: boolean, eventTitle: string): string {
  return register ? "You are registered" : `Registration cancelled for ${eventTitle}`;
}
