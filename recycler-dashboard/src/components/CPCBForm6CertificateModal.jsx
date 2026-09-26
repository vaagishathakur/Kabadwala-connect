import React from 'react';
import {
  Dialog, DialogContent, DialogActions, Button, Box, Typography,
  Divider, Grid, Stack, Chip
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import CloseIcon from '@mui/icons-material/Close';
import VerifiedIcon from '@mui/icons-material/Verified';
import GavelIcon from '@mui/icons-material/Gavel';

export default function CPCBForm6CertificateModal({ open, onClose, certificate }) {
  if (!certificate) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogContent sx={{ p: { xs: 2, sm: 4 }, bgcolor: '#FAFBF8' }} id="printable-form6">
        {/* Border Container styled as official government certificate */}
        <Box
          sx={{
            border: '3px double #0F766E',
            p: { xs: 2, sm: 3.5 },
            bgcolor: '#FFFFFF',
            borderRadius: 1,
            position: 'relative',
          }}
        >
          {/* Watermark */}
          <Typography
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%) rotate(-30deg)',
              fontSize: '4.5rem',
              fontWeight: 900,
              color: 'rgba(13, 148, 136, 0.05)',
              pointerEvents: 'none',
              letterSpacing: 8,
              textAlign: 'center',
              width: '100%',
            }}
          >
            CPCB CERTIFIED
          </Typography>

          {/* Official MoEFCC Header */}
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <Typography variant="overline" sx={{ letterSpacing: 2, fontWeight: 800, color: '#475569' }}>
              GOVERNMENT OF INDIA
            </Typography>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1E293B', letterSpacing: 0.5 }}>
              MINISTRY OF ENVIRONMENT, FOREST AND CLIMATE CHANGE
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 900, color: '#0F766E', mt: 0.5 }}>
              CENTRAL POLLUTION CONTROL BOARD (CPCB)
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
              Parivesh Bhawan, East Arjun Nagar, Delhi - 110032
            </Typography>

            <Divider sx={{ my: 1.5, borderColor: '#0D9488', borderWidth: 1 }} />

            <Typography variant="subtitle2" sx={{ fontWeight: 800, bgcolor: '#F0FDFA', py: 0.5, px: 2, display: 'inline-block', borderRadius: 1, color: '#0F766E', border: '1px solid #99F6E4' }}>
              FORM - 6 [See Rule 13(3)(vii), 13(4)(vii) and 14(1)(vi)]
            </Typography>
            <Typography variant="body2" fontWeight="bold" sx={{ mt: 0.5, color: '#0F172A' }}>
              CERTIFICATE OF SAFE RECYCLING & EXTENDED PRODUCER RESPONSIBILITY (EPR) MANIFEST
            </Typography>
          </Box>

          {/* Metadata Bar */}
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" sx={{ mb: 2, p: 1, bgcolor: '#F8FAFC', borderRadius: 1, border: '1px solid #E2E8F0' }}>
            <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
              <strong>Cert No:</strong> {certificate.certificate_number}
            </Typography>
            <Typography variant="caption">
              <strong>Date:</strong> {new Date(certificate.issuance_timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </Typography>
          </Stack>

          {/* Section 1: Recycler Facility */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" fontWeight="bold" color="#0F766E" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
              PART A: AUTHORIZED RECYCLER FACILITY
            </Typography>
            <Grid container spacing={1} sx={{ mt: 0.2 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">Facility Name:</Typography>
                <Typography variant="body2" fontWeight="bold">{certificate.recycler.company_name}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">CPCB Registration Number:</Typography>
                <Typography variant="body2" fontWeight="bold" color="#0F766E">{certificate.recycler.cpcb_authorization}</Typography>
              </Grid>
              <Grid item xs={12} sm={8}>
                <Typography variant="caption" color="text.secondary">Facility Address:</Typography>
                <Typography variant="body2">{certificate.recycler.facility_address}</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="caption" color="text.secondary">SPCB Consent / NOC:</Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{certificate.recycler.spcb_noc}</Typography>
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ my: 1.5 }} />

          {/* Section 2: Consignment Manifest */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" fontWeight="bold" color="#0F766E" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
              PART B: E-WASTE CONSIGNMENT & SCALE AUDIT
            </Typography>
            <Grid container spacing={1.5} sx={{ mt: 0.2 }}>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary">CPCB Material Code</Typography>
                <Typography variant="body1" fontWeight="bold" color="#0F766E">{certificate.lot_manifest.material_cpcb_code}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary">Claimed Weight</Typography>
                <Typography variant="body1">{certificate.lot_manifest.claimed_weight_kg} kg</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary">Calibrated Net Weight</Typography>
                <Typography variant="body1" fontWeight="bold">{certificate.lot_manifest.confirmed_net_weight_kg} kg</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary">Certified Pure Yield</Typography>
                <Typography variant="body1" fontWeight="bold" color="#0D9488">
                  {certificate.lot_manifest.effective_pure_yield_kg} kg ({certificate.lot_manifest.purity_percentage}%)
                </Typography>
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ my: 1.5 }} />

          {/* Section 3: Traceability & Financial Settlement */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" fontWeight="bold" color="#0F766E" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
              PART C: INFORMAL SECTOR DISBURSEMENT & TRACEABILITY
            </Typography>
            <Grid container spacing={1} sx={{ mt: 0.2 }}>
              <Grid item xs={12} sm={4}>
                <Typography variant="caption" color="text.secondary">Transferor (Anonymized Kabadiwala):</Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  {certificate.settlement.collector_anonymized_id ? `${certificate.settlement.collector_anonymized_id.slice(0, 16)}...` : 'SECURE_HASH'}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={4}>
                <Typography variant="caption" color="text.secondary">Total Compensation Disbursed:</Typography>
                <Typography variant="body1" fontWeight="bold">₹{certificate.settlement.payout_amount_inr}</Typography>
              </Grid>
              <Grid item xs={6} sm={4}>
                <Typography variant="caption" color="text.secondary">Settlement UTR Proof:</Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                  {certificate.settlement.payment_mode}: {certificate.settlement.bank_utr}
                </Typography>
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ my: 1.5 }} />

          {/* Section 4: Regulatory Declaration & Digital Seal */}
          <Box sx={{ p: 2, bgcolor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 1.5 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5} alignItems="center">
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" color="#166534" sx={{ fontWeight: 700, display: 'block', mb: 0.8, fontSize: '0.88rem' }}>
                  STATUTORY DECLARATION UNDER E-WASTE (MANAGEMENT) RULES, 2022:
                </Typography>
                <Typography variant="body2" sx={{ color: '#14532D', fontSize: '0.84rem', display: 'block', lineHeight: 1.5 }}>
                  "It is hereby certified that the e-waste material indicated in this manifest has been received from the informal recovery channel, inspected via calibrated scales, and processed in accordance with the environmentally sound technologies prescribed under Schedule II. Hazardous fractions (Pb, Cd, Hg, BFRs) have been channeled to authorized TSDF facilities with zero environmental release."
                </Typography>
                <Typography variant="caption" sx={{ fontFamily: 'monospace', display: 'block', mt: 1, color: '#334155', fontSize: '0.78rem', wordBreak: 'break-all' }}>
                  <strong>SHA-256 Audit Seal:</strong> {certificate.verification.audit_hash_sha256}
                </Typography>
              </Box>

              <Box sx={{ textAlign: 'center', flexShrink: 0 }}>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(certificate.verification.verification_url)}`}
                  alt="CPCB Verification QR"
                  style={{ width: 88, height: 88, display: 'block', margin: '0 auto' }}
                />
                <Typography variant="caption" sx={{ fontSize: '0.72rem', color: '#166534', fontWeight: 700, mt: 0.5, display: 'block' }}>
                  Scan to Verify CPCB Portal
                </Typography>
              </Box>
            </Stack>
          </Box>

          <Stack direction="row" justifyContent="space-between" alignItems="flex-end" sx={{ mt: 3, pt: 1 }}>
            <Box>
              <Chip icon={<VerifiedIcon sx={{ fontSize: 18 }} />} label="Digitally Certified by KabadConnect" size="small" color="success" sx={{ fontSize: '0.82rem', height: 28 }} />
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="caption" sx={{ display: 'block', fontStyle: 'italic', fontSize: '0.82rem' }}>
                For {certificate.recycler.company_name}
              </Typography>
              <Typography variant="body1" fontWeight="bold" sx={{ mt: 1, borderTop: '1px solid #94A3B8', pt: 0.5, minWidth: 180, fontSize: '0.92rem' }}>
                Authorized Weighbridge Signatory
              </Typography>
            </Box>
          </Stack>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, bgcolor: '#F8FAFC' }}>
        <Button onClick={onClose} startIcon={<CloseIcon />} color="inherit" sx={{ fontSize: '0.92rem', fontWeight: 600 }}>
          Close
        </Button>
        <Button
          onClick={handlePrint}
          variant="contained"
          startIcon={<PrintIcon sx={{ fontSize: 20 }} />}
          sx={{
            bgcolor: '#2563EB',
            color: '#FFFFFF',
            fontWeight: 700,
            fontSize: '0.95rem',
            py: 1.2,
            px: 2.5,
            border: '1px solid #1D4ED8',
            '&:hover': { bgcolor: '#1D4ED8' }
          }}
        >
          Print Official Form-6 Voucher / PDF
        </Button>
      </DialogActions>
    </Dialog>
  );
}
