import mongoose, { Document, Schema, Types } from 'mongoose';
import { ShipmentStatus } from '../../../src/utils/cargo-rules.ts';

export interface ICargo extends Document {
  cargoCode: string; // e.g. CG-10025
  sender: string;
  receiver: string;
  cargoType: string;
  weight: number; // in kg
  origin: string;
  destination: string;
  shipmentDate: Date;
  expectedArrival?: Date;
  status: ShipmentStatus;
  warehouse?: Types.ObjectId | string;
  storageLocation?: string; // e.g. Section B, Rack 4
  createdAt: Date;
  updatedAt: Date;
}

export const CargoSchema = new Schema<ICargo>(
  {
    cargoCode: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    sender: { type: String, required: true, trim: true },
    receiver: { type: String, required: true, trim: true },
    cargoType: { type: String, required: true, trim: true },
    weight: { type: Number, required: true, min: [0.01, 'Weight must be positive'] },
    origin: { type: String, required: true, trim: true },
    destination: { type: String, required: true, trim: true },
    shipmentDate: { type: Date, default: Date.now },
    expectedArrival: { type: Date },
    status: {
      type: String,
      enum: ['Registered', 'Received', 'Stored', 'Processing', 'Loaded', 'In Transit', 'Delivered'],
      default: 'Registered',
      index: true,
    },
    warehouse: { type: Schema.Types.ObjectId, ref: 'Warehouse' },
    storageLocation: { type: String, trim: true },
  },
  { timestamps: true }
);

export const CargoModel = mongoose.models.Cargo || mongoose.model<ICargo>('Cargo', CargoSchema);
