/**
 * NCBI Standard Genetic Code (Translation Table 1).
 * All 64 codons listed explicitly.
 * Source: https://www.ncbi.nlm.nih.gov/Taxonomy/Utils/wprintgc.cgi?chapter=tgencodes#SG1
 */

export const CODONS = Object.freeze({
  // U__ codons
  'UUU': 'Phe', 'UUC': 'Phe',
  'UUA': 'Leu', 'UUG': 'Leu',
  'UCU': 'Ser', 'UCC': 'Ser', 'UCA': 'Ser', 'UCG': 'Ser',
  'UAU': 'Tyr', 'UAC': 'Tyr',
  'UAA': 'Stop', 'UAG': 'Stop',
  'UGU': 'Cys', 'UGC': 'Cys',
  'UGA': 'Stop',
  'UGG': 'Trp',
  // C__ codons
  'CUU': 'Leu', 'CUC': 'Leu', 'CUA': 'Leu', 'CUG': 'Leu',
  'CCU': 'Pro', 'CCC': 'Pro', 'CCA': 'Pro', 'CCG': 'Pro',
  'CAU': 'His', 'CAC': 'His',
  'CAA': 'Gln', 'CAG': 'Gln',
  'CGU': 'Arg', 'CGC': 'Arg', 'CGA': 'Arg', 'CGG': 'Arg',
  // A__ codons
  'AUU': 'Ile', 'AUC': 'Ile', 'AUA': 'Ile',
  'AUG': 'Met',
  'ACU': 'Thr', 'ACC': 'Thr', 'ACA': 'Thr', 'ACG': 'Thr',
  'AAU': 'Asn', 'AAC': 'Asn',
  'AAA': 'Lys', 'AAG': 'Lys',
  'AGU': 'Ser', 'AGC': 'Ser',
  'AGA': 'Arg', 'AGG': 'Arg',
  // G__ codons
  'GUU': 'Val', 'GUC': 'Val', 'GUA': 'Val', 'GUG': 'Val',
  'GCU': 'Ala', 'GCC': 'Ala', 'GCA': 'Ala', 'GCG': 'Ala',
  'GAU': 'Asp', 'GAC': 'Asp',
  'GAA': 'Glu', 'GAG': 'Glu',
  'GGU': 'Gly', 'GGC': 'Gly', 'GGA': 'Gly', 'GGG': 'Gly',
});

export const AMINO_ACIDS = Object.freeze([
  { name: 'Alanine',       abbrev3: 'Ala', abbrev1: 'A', color: '#e8a838' }, // nonpolar
  { name: 'Arginine',      abbrev3: 'Arg', abbrev1: 'R', color: '#3498db' }, // positively charged
  { name: 'Asparagine',    abbrev3: 'Asn', abbrev1: 'N', color: '#2ecc71' }, // polar uncharged
  { name: 'Aspartate',     abbrev3: 'Asp', abbrev1: 'D', color: '#e74c3c' }, // negatively charged
  { name: 'Cysteine',      abbrev3: 'Cys', abbrev1: 'C', color: '#9b59b6' }, // special
  { name: 'Glutamine',     abbrev3: 'Gln', abbrev1: 'Q', color: '#2ecc71' }, // polar uncharged
  { name: 'Glutamate',     abbrev3: 'Glu', abbrev1: 'E', color: '#e74c3c' }, // negatively charged
  { name: 'Glycine',       abbrev3: 'Gly', abbrev1: 'G', color: '#9b59b6' }, // special
  { name: 'Histidine',     abbrev3: 'His', abbrev1: 'H', color: '#3498db' }, // positively charged (at low pH)
  { name: 'Isoleucine',    abbrev3: 'Ile', abbrev1: 'I', color: '#e8a838' }, // nonpolar
  { name: 'Leucine',       abbrev3: 'Leu', abbrev1: 'L', color: '#e8a838' }, // nonpolar
  { name: 'Lysine',        abbrev3: 'Lys', abbrev1: 'K', color: '#3498db' }, // positively charged
  { name: 'Methionine',    abbrev3: 'Met', abbrev1: 'M', color: '#e8a838' }, // nonpolar
  { name: 'Phenylalanine', abbrev3: 'Phe', abbrev1: 'F', color: '#e8a838' }, // nonpolar (aromatic)
  { name: 'Proline',       abbrev3: 'Pro', abbrev1: 'P', color: '#9b59b6' }, // special
  { name: 'Serine',        abbrev3: 'Ser', abbrev1: 'S', color: '#2ecc71' }, // polar uncharged
  { name: 'Threonine',     abbrev3: 'Thr', abbrev1: 'T', color: '#2ecc71' }, // polar uncharged
  { name: 'Tryptophan',    abbrev3: 'Trp', abbrev1: 'W', color: '#e8a838' }, // nonpolar (aromatic)
  { name: 'Tyrosine',      abbrev3: 'Tyr', abbrev1: 'Y', color: '#2ecc71' }, // polar uncharged (aromatic)
  { name: 'Valine',        abbrev3: 'Val', abbrev1: 'V', color: '#e8a838' }, // nonpolar
  { name: 'Stop',          abbrev3: 'Stop', abbrev1: '*', color: '#95a5a6' }, // stop
]);

export const SOURCE = Object.freeze({
  name: 'NCBI Translation Table 1 (Standard)',
  url: 'https://www.ncbi.nlm.nih.gov/Taxonomy/Utils/wprintgc.cgi?chapter=tgencodes#SG1',
  retrieved: '2026-10-14',
});
