export type {
  IDNSRecord,
  IDNSQueryResponse,
  CustomDnsResolver,
  OpenAttestationDNSTextRecord,
  OpenAttestationDnsDidRecord,
} from '@tradetrust-tt/dnsprove';

export {
  defaultDnsResolvers,
  queryDns,
  parseOpenAttestationRecord,
  parseDocumentStoreResults,
  parseDnsDidResults,
  getDocumentStoreRecords,
  getDnsDidRecords,
} from '@tradetrust-tt/dnsprove';
