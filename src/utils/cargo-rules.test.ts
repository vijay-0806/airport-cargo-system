import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateAvailableCapacity,
  canAcceptCargo,
  isValidCargoCode,
  generateCargoCode,
  isValidStatusTransition,
  getShipmentProgress,
} from './cargo-rules.ts';

test('calculateAvailableCapacity correctly computes available kilograms', () => {
  assert.equal(calculateAvailableCapacity(50000, 20000), 30000);
  assert.equal(calculateAvailableCapacity(10000, 10000), 0);
  // Clamps negative if occupied exceeds total
  assert.equal(calculateAvailableCapacity(1000, 1200), 0);
});

test('calculateAvailableCapacity throws on negative input', () => {
  assert.throws(() => calculateAvailableCapacity(-10, 50), /non-negative/);
});

test('canAcceptCargo checks warehouse remaining capacity', () => {
  assert.equal(canAcceptCargo(10000, 8000, 1500), true);
  assert.equal(canAcceptCargo(10000, 8000, 2000), true);
  assert.equal(canAcceptCargo(10000, 8000, 2500), false);
  assert.equal(canAcceptCargo(10000, 8000, -100), false); // non-positive weight rejected
});

test('isValidCargoCode validates airport cargo format', () => {
  assert.equal(isValidCargoCode('CG-10025'), true);
  assert.equal(isValidCargoCode('cg-10025'), true);
  assert.equal(isValidCargoCode('CG-99999'), true);
  assert.equal(isValidCargoCode('CARGO-100'), false);
  assert.equal(isValidCargoCode('CG-abc'), false);
});

test('generateCargoCode generates consistent airport cargo codes', () => {
  assert.equal(generateCargoCode(25), 'CG-10025');
  assert.equal(generateCargoCode(1), 'CG-10001');
});

test('isValidStatusTransition validates sequential airport cargo lifecycle', () => {
  // Allowed forward steps
  assert.equal(isValidStatusTransition('Registered', 'Received'), true);
  assert.equal(isValidStatusTransition('Received', 'Stored'), true);
  assert.equal(isValidStatusTransition('Received', 'Processing'), true);
  assert.equal(isValidStatusTransition('Stored', 'Processing'), true);
  assert.equal(isValidStatusTransition('Processing', 'Loaded'), true);
  assert.equal(isValidStatusTransition('Loaded', 'In Transit'), true);
  assert.equal(isValidStatusTransition('In Transit', 'Delivered'), true);

  // Idempotent
  assert.equal(isValidStatusTransition('Stored', 'Stored'), true);

  // Disallowed backwards or skipping transitions
  assert.equal(isValidStatusTransition('Registered', 'Delivered'), false);
  assert.equal(isValidStatusTransition('Delivered', 'Registered'), false);
  assert.equal(isValidStatusTransition('Processing', 'Received'), false);
});

test('getShipmentProgress accurately returns 0 to 100 percentage', () => {
  assert.equal(getShipmentProgress('Registered'), 0);
  assert.equal(getShipmentProgress('Delivered'), 100);
  assert.equal(getShipmentProgress('Processing'), 50);
});
