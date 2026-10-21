import React from 'react';
import { FileCode, Database, Server, Globe, Shield, Terminal, Zap, BookOpen } from 'lucide-react';

export const DocsPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto text-xs text-slate-700">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          System Architecture &amp; Deployment Guide
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Complete documentation for the Airport Cargo &amp; Warehouse Management System (College Project).
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-blue-600 font-bold text-sm">
            <Globe className="w-4 h-4" />
            <span>Frontend (Vercel)</span>
          </div>
          <p className="text-slate-600">
            React 19 + TypeScript SPA built with Vite and Tailwind CSS. Communicates via REST APIs with JWT authentication.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-sky-600 font-bold text-sm">
            <Server className="w-4 h-4" />
            <span>Backend (Render)</span>
          </div>
          <p className="text-slate-600">
            Node.js + Express + TypeScript REST API. Zod validation, role authorization (ADMIN / WAREHOUSE_STAFF), and bcrypt hashing.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
            <Database className="w-4 h-4" />
            <span>Database &amp; Redis</span>
          </div>
          <p className="text-slate-600">
            MongoDB Atlas as primary database. Redis for high-speed tracking cache-aside with graceful in-memory fallback.
          </p>
        </div>
      </div>

      {/* Local Development Without Docker */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2 font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
          <Terminal className="w-4 h-4 text-blue-600" />
          <span>Local Development in VS Code (No Docker Required)</span>
        </div>

        <div className="space-y-2">
          <p className="font-semibold text-slate-800">1. Install Dependencies</p>
          <pre className="p-3 bg-slate-900 text-slate-200 rounded-lg font-mono overflow-x-auto text-[11px]">
            npm install
          </pre>
        </div>

        <div className="space-y-2">
          <p className="font-semibold text-slate-800">2. Configure Environment (.env)</p>
          <pre className="p-3 bg-slate-900 text-slate-200 rounded-lg font-mono overflow-x-auto text-[11px]">
{`PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/airport_cargo?retryWrites=true&w=majority
JWT_SECRET=super-secret-jwt-key-2026
REDIS_URL=redis://default:<password>@<host>:<port>  # Optional (graceful fallback if omitted)`}
          </pre>
        </div>

        <div className="space-y-2">
          <p className="font-semibold text-slate-800">3. Run Unit Tests &amp; Start Dev Server</p>
          <pre className="p-3 bg-slate-900 text-slate-200 rounded-lg font-mono overflow-x-auto text-[11px]">
{`npm test       # Runs Node test runner unit tests on cargo lifecycle rules
npm run dev    # Launches full-stack server on http://localhost:3000`}
          </pre>
        </div>
      </div>

      {/* Deployment Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
            <Globe className="w-4 h-4 text-blue-600" />
            <span>Frontend Deployment (Vercel)</span>
          </div>
          <ul className="space-y-2 list-disc list-inside text-slate-600">
            <li>Connect your GitHub repository to Vercel.</li>
            <li>Framework Preset: <strong>Vite</strong>.</li>
            <li>Build Command: <code>npm run build</code>.</li>
            <li>Output Directory: <code>dist</code>.</li>
            <li>Environment Variable: <code>VITE_API_URL=https://your-backend.onrender.com</code></li>
          </ul>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
            <Server className="w-4 h-4 text-sky-600" />
            <span>Backend Deployment (Render)</span>
          </div>
          <ul className="space-y-2 list-disc list-inside text-slate-600">
            <li>Deploy as a Web Service on Render.</li>
            <li>Environment: <strong>Node</strong>.</li>
            <li>Build Command: <code>npm run build</code></li>
            <li>Start Command: <code>node server.ts</code> (or <code>npm start</code>)</li>
            <li>Configure <code>MONGODB_URI</code>, <code>JWT_SECRET</code>, <code>REDIS_URL</code>.</li>
            <li>Health Check Path: <code>/api/health</code>.</li>
          </ul>
        </div>
      </div>

      {/* REST API Reference */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center gap-2 font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
          <BookOpen className="w-4 h-4 text-blue-600" />
          <span>Core REST API Endpoints</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px]">
          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-blue-700 font-bold">POST</span> /api/auth/login
          </div>
          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-emerald-700 font-bold">GET</span> /api/auth/me
          </div>
          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-emerald-700 font-bold">GET</span> /api/dashboard/stats
          </div>
          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-emerald-700 font-bold">GET</span> /api/cargo (search, filter, paginate)
          </div>
          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-blue-700 font-bold">POST</span> /api/cargo (register incoming cargo)
          </div>
          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-amber-700 font-bold">PUT</span> /api/shipments/:id/status
          </div>
          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-emerald-700 font-bold">GET</span> /api/warehouses (live capacity)
          </div>
          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-emerald-700 font-bold">GET</span> /api/tracking/:cargoCode (Redis cached)
          </div>
        </div>
      </div>
    </div>
  );
};
