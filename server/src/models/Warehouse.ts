import mongoose, { Document, Schema } from 'mongoose';

export interface IWarehouse extends Document {
  warehouseCode: string;
  name: string;
  location: string;
  totalCapacity: number; // in kg
  occupiedCapacity: number; // in kg
  createdAt: Date;
  updatedAt: Date;
}

export const WarehouseSchema = new Schema<IWarehouse>(
  {
    warehouseCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    totalCapacity: { type: Number, required: true, min: [0, 'Total capacity cannot be negative'] },
    occupiedCapacity: { type: Number, default: 0, min: [0, 'Occupied capacity cannot be negative'] },
  },
  { timestamps: true }
);

WarehouseSchema.virtual('availableCapacity').get(function (this: IWarehouse) {
  return Math.max(0, this.totalCapacity - this.occupiedCapacity);
});

export const WarehouseModel = mongoose.models.Warehouse || mongoose.model<IWarehouse>('Warehouse', WarehouseSchema);
