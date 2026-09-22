* {
  box-sizing: border-box;
}

:root {
  --bg: #0f172a;
  --panel: #111827;
  --panel-light: #1f2937;
  --text: #e5e7eb;
  --muted: #9ca3af;
  --primary: #4f46e5;
  --primary-hover: #4338ca;
  --border: rgba(148, 163, 184, 0.2);
  --success: #10b981;
  --danger: #ef4444;
}

body {
  margin: 0;
  font-family: Arial, sans-serif;
  background: linear-gradient(135deg, #0f172a 0%, #111827 100%);
  color: var(--text);
}

.auth-body, .dashboard-body {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.auth-card {
  width: min(100%, 460px);
  background: rgba(17, 24, 39, 0.96);
  border: 1px solid var(--border);
  border-radius: 18px;
  padding: 28px;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.25);
}

h1, h2 {
  margin-top: 0;
}

form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

label {
  font-size: 0.95rem;
  font-weight: 600;
}

input, select, button {
  width: 100%;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid var(--border);
  font-size: 1rem;
}

input, select {
  background: rgba(15, 23, 42, 0.7);
  color: var(--text);
}

button {
  background: var(--primary);
  color: white;
  border: none;
  font-weight: 700;
  cursor: pointer;
}

button:hover {
  background: var(--primary-hover);
}

.alert {
  padding: 12px 14px;
  border-radius: 10px;
  margin-bottom: 18px;
  font-weight: 600;
}

.alert.error {
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.35);
  color: #fecaca;
}

.helper-box {
  margin-top: 18px;
  background: rgba(15, 118, 110, 0.12);
  border: 1px solid rgba(45, 212, 191, 0.3);
  padding: 14px;
  border-radius: 10px;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 0.92rem;
}

.link-row {
  margin-top: 18px;
  text-align: center;
}

.link-row a {
  color: var(--text);
}

.container {
  width: min(1200px, 100%);
  margin: 30px auto;
  padding: 0 20px 36px;
}

.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.date-pill {
  display: inline-block;
  background: rgba(79, 70, 229, 0.18);
  border: 1px solid rgba(99, 102, 241, 0.5);
  padding: 8px 12px;
  border-radius: 999px;
  font-size: 0.8rem;
}

.logout {
  color: var(--text);
  text-decoration: none;
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.25);
  padding: 8px 12px;
  border-radius: 999px;
}

.panel {
  background: rgba(17, 24, 39, 0.95);
  border: 1px solid var(--border);
  border-radius: 18px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.12);
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.checkbox-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
}

.checkbox-row input {
  width: auto;
}

.table-wrap {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 12px 10px;
  border-bottom: 1px solid var(--border);
  text-align: left;
}

th {
  color: var(--muted);
  font-size: 0.8rem;
  text-transform: uppercase;
}

.chart-panel {
  min-height: 360px;
}

#historyChart {
  width: 100%;
  height: 300px;
}

@media (max-width: 768px) {
  .topbar {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .topbar-actions {
    width: 100%;
    justify-content: space-between;
  }
}
