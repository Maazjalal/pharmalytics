export type ClientStatus = "treatment" | "settled";

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Client {
  id: string;
  clientCode: string;
  name: string;
  status: ClientStatus;
  archived: boolean;
  createdAt: string;
  createdBy: string;
  attachmentOriginalName: string | null;
  attachmentUploadedAt: string | null;
}

export interface Medication {
  id: string;
  name: string;
  defaultPrice: string;
}

export interface ClientMedication {
  id: string;
  clientId: string;
  medicationId: string;
  price: string;
  dosage: string;
  dosageUnit: string;
  prescriptionDate: string;
  dateAdded: string;
  medication: Medication;
}

export interface ClientDetail extends Client {
  clientMedications: ClientMedication[];
  total: number;
}
