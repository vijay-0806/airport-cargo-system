import mongoose, { Document, Schema, Types } from 'mongoose';
import { ShipmentStatus } from '../../../src/utils/cargo-rules.ts';

export interface IShipment extends Document {
  cargo: Types.ObjectId | string;
  shipmentDate: Date;
  expectedArrival?: Date;
  currentLocation: string;
  status: ShipmentStatus;
  createdAt: Date;
  updatedAt: Date;
}

export const ShipmentSchema = new Schema<IShipment>(
  {
    cargo: { type: Schema.Types.ObjectId, ref: 'Cargo', required: true, index: true },
    shipmentDate: { type: Date, default: Date.now },
    expectedArrival: { type: Date },
    currentLocation: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['Registered', 'Received', 'Stored', 'Processing', 'Loaded', 'In Transit', 'Delivered'],
      default: 'Registered',
      index: true,
    },
  },
  { timestamps: true }
);

export const ShipmentModel = mongoose.models.Shipment || mongoose.model<IShipment>('Shipment', ShipmentSchema);
