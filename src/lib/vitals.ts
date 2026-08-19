export interface VitalFlag {
  label: string;
  severity: "warning" | "critical";
}

export function flagVitals(v: {
  bpSystolic?: number | null;
  bpDiastolic?: number | null;
  pulseBpm?: number | null;
  temperatureC?: number | null;
  respiratoryRate?: number | null;
  spo2?: number | null;
  painScore?: number | null;
  bmi?: number | null;
}): VitalFlag[] {
  const flags: VitalFlag[] = [];

  if (v.bpSystolic != null) {
    if (v.bpSystolic >= 180 || v.bpSystolic < 90) flags.push({ label: "BP systolic critical", severity: "critical" });
    else if (v.bpSystolic >= 130) flags.push({ label: "BP systolic high", severity: "warning" });
  }
  if (v.bpDiastolic != null) {
    if (v.bpDiastolic >= 120 || v.bpDiastolic < 60) flags.push({ label: "BP diastolic critical", severity: "critical" });
    else if (v.bpDiastolic >= 80) flags.push({ label: "BP diastolic high", severity: "warning" });
  }
  if (v.pulseBpm != null) {
    if (v.pulseBpm > 130 || v.pulseBpm < 40) flags.push({ label: "Pulse critical", severity: "critical" });
    else if (v.pulseBpm > 100 || v.pulseBpm < 60) flags.push({ label: "Pulse abnormal", severity: "warning" });
  }
  if (v.temperatureC != null) {
    if (v.temperatureC >= 39.5 || v.temperatureC < 35) flags.push({ label: "Temperature critical", severity: "critical" });
    else if (v.temperatureC >= 37.5 || v.temperatureC < 36) flags.push({ label: "Temperature abnormal", severity: "warning" });
  }
  if (v.respiratoryRate != null) {
    if (v.respiratoryRate > 30 || v.respiratoryRate < 8) flags.push({ label: "Respiratory rate critical", severity: "critical" });
    else if (v.respiratoryRate > 20 || v.respiratoryRate < 12) flags.push({ label: "Respiratory rate abnormal", severity: "warning" });
  }
  if (v.spo2 != null) {
    if (v.spo2 < 90) flags.push({ label: "SpO2 critical", severity: "critical" });
    else if (v.spo2 < 95) flags.push({ label: "SpO2 low", severity: "warning" });
  }
  if (v.painScore != null && v.painScore >= 7) {
    flags.push({ label: "Severe pain", severity: "critical" });
  }
  if (v.bmi != null) {
    if (v.bmi >= 30 || v.bmi < 16) flags.push({ label: "BMI abnormal", severity: "warning" });
  }

  return flags;
}
