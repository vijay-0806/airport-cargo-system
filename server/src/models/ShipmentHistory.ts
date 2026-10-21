import mongoose, { Document, Schema, Types } from 'mongoose';
import { ShipmentStatus } from '../../../src/utils/cargo-rules.ts';

export interface IShipmentHistory extends Document {
  cargo: Types.ObjectId | string;
  previousStatus: ShipmentStatus | string;
  status: ShipmentStatus;
  location: string;
  updatedBy: Types.ObjectId | string;
  timestamp: Date;
}

export const ShipmentHistorySchema = new Schema<IShipmentHistory>(
  {
    cargo: { type: Schema.Types.ObjectId, ref: 'Cargo', required: true, index: true },
    previousStatus: { type: String, required: true },
    status: {
      type: String,
      enum: ['Registered', 'Received', 'Stored', 'Processing', 'Loaded', 'In Transit', 'Delivered'],
      required: true,
      index: true,
    },
    location: { type: String, required: true, trim: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

export const ShipmentHistoryModel =
  mongoose.models.ShipmentHistory || mongoose.model<IShipmentHistory>('ShipmentHistory', ShipmentHistorySchema);
