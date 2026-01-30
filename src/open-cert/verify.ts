import fetch from 'node-fetch';
import {
  Array as RunTypesArray,
  Boolean,
  Literal,
  Optional,
  Record,
  Static,
  String,
  Union,
} from 'runtypes';
import {
  CodedError,
  InvalidVerificationFragment,
  Reason,
  ValidVerificationFragment,
  VerificationBuilderOptions,
  VerificationFragment,
  VerificationFragmentType,
  Verifier,
  verificationBuilder,
  isValid as oaIsValid,
  openAttestationVerifiers,
  utils as ttVerifyUtils,
} from '@tradetrust-tt/tt-verify';
import { getData, utils, v3 } from '@tradetrust-tt/tradetrust';

export const RegistryEntry = Record({
  name: String,
  displayCard: Boolean,
  website: Optional(String),
  email: Optional(String),
  phone: Optional(String),
  logo: Optional(String),
  id: Optional(String),
});
export type RegistryEntry = Static<typeof RegistryEntry>;

export interface Registry {
  issuers: {
    [key: string]: RegistryEntry;
  };
}

export const OpencertsRegistryVerificationValidData = RegistryEntry.And(
  Record({
    value: String,
    status: Literal('VALID'),
  }),
);

export type OpencertsRegistryVerificationValidData = Static<
  typeof OpencertsRegistryVerificationValidData
>;

export const OpencertsRegistryVerificationInvalidData = Record({
  value: String,
  status: Literal('INVALID'),
  reason: Reason,
});
export type OpencertsRegistryVerificationInvalidData = Static<
  typeof OpencertsRegistryVerificationInvalidData
>;

// if one issuer is valid => fragment status is valid otherwise if all issuers are invalid => invalid
export const OpencertsRegistryVerificationValidDataArray = RunTypesArray(
  Union(OpencertsRegistryVerificationValidData, OpencertsRegistryVerificationInvalidData),
);
export type OpencertsRegistryVerificationValidDataArray = Static<
  typeof OpencertsRegistryVerificationValidDataArray
>;
export const OpencertsRegistryVerificationInvalidDataArray = RunTypesArray(
  OpencertsRegistryVerificationInvalidData,
);
export type OpencertsRegistryVerificationInvalidDataArray = Static<
  typeof OpencertsRegistryVerificationInvalidDataArray
>;

export type OpencertsRegistryVerifierValidFragmentV2 =
  ValidVerificationFragment<OpencertsRegistryVerificationValidDataArray>;
export type OpencertsRegistryVerifierInvalidFragmentV2 =
  InvalidVerificationFragment<OpencertsRegistryVerificationInvalidDataArray>;
export type OpencertsRegistryVerifierValidFragmentV3 =
  ValidVerificationFragment<OpencertsRegistryVerificationValidData>;
export type OpencertsRegistryVerifierInvalidFragmentV3 =
  InvalidVerificationFragment<OpencertsRegistryVerificationInvalidData>;
export type OpencertsRegistryVerifierVerificationFragment =
  | OpencertsRegistryVerifierValidFragmentV2
  | OpencertsRegistryVerifierInvalidFragmentV2
  | OpencertsRegistryVerifierValidFragmentV3
  | OpencertsRegistryVerifierInvalidFragmentV3;

type VerifierType = Verifier<OpencertsRegistryVerifierVerificationFragment>;

export const type = 'ISSUER_IDENTITY';
export const name = 'OpencertsRegistryVerifier';

// NEVER EVER REPLACE OR CHANGE A VALUE :)
// code for errors and invalid fragment
export enum OpencertsRegistryCode {
  INVALID_IDENTITY = 0,
  SKIPPED = 1,
  UNEXPECTED_ERROR = 2,
}

const storeToData = (
  registry: Registry,
  store: string,
): OpencertsRegistryVerificationValidData | OpencertsRegistryVerificationInvalidData => {
  const key = Object.keys(registry.issuers).find((k) => k.toLowerCase() === store.toLowerCase());
  if (key) {
    return {
      status: 'VALID' as const,
      value: store,
      ...registry.issuers[key],
    };
  }
  return {
    value: store,
    status: 'INVALID' as const,
    reason: {
      code: OpencertsRegistryCode.INVALID_IDENTITY,
      codeString: OpencertsRegistryCode[OpencertsRegistryCode.INVALID_IDENTITY],
      message: `Document store ${store} not found in the registry`,
    },
  };
};

export const registryVerifier: VerifierType = {
  test: (document) => {
    if (utils.isWrappedV3Document(document)) {
      return document.openAttestationMetadata.proof.method === v3.Method.DocumentStore;
    } else if (utils.isWrappedV2Document(document)) {
      const documentData = getData(document);
      return documentData.issuers.some(
        (issuer) => 'documentStore' in issuer || 'certificateStore' in issuer,
      );
    }

    return false;
  },
  skip: () => {
    return Promise.resolve({
      status: 'SKIPPED',
      type,
      name,
      reason: {
        code: OpencertsRegistryCode.SKIPPED,
        codeString: OpencertsRegistryCode[OpencertsRegistryCode.SKIPPED],
        message: `Document issuers doesn't have "documentStore" or "certificateStore" property or ${v3.Method.DocumentStore} method`,
      },
    });
  },
  verify: async (document): Promise<OpencertsRegistryVerifierVerificationFragment> => {
    const res = await fetch('https://opencerts.io/static/registry.json');
    const registryJson: unknown = await res.json();
    const registry = registryJson as Registry;

    if (utils.isWrappedV3Document(document)) {
      const data = storeToData(registry, document.openAttestationMetadata.proof.value);
      if (OpencertsRegistryVerificationValidData.guard(data)) {
        return {
          type,
          name,
          status: 'VALID',
          data,
        };
      } else {
        return {
          type,
          name,
          status: 'INVALID',
          data,
          reason: data.reason,
        };
      }
    }

    const documentData = getData(document);
    const issuerFragments = documentData.issuers.map((issuer) =>
      storeToData(registry, issuer.documentStore || issuer.certificateStore || ''),
    );
    // if one issuer is valid => fragment status is valid otherwise if all issuers are invalid => invalid
    const invalidIssuer = issuerFragments.find(OpencertsRegistryVerificationInvalidData.guard);
    if (
      OpencertsRegistryVerificationInvalidDataArray.guard(issuerFragments) &&
      OpencertsRegistryVerificationInvalidData.guard(invalidIssuer)
    ) {
      return {
        type,
        name,
        status: 'INVALID',
        data: issuerFragments,
        reason: invalidIssuer.reason,
      };
    } else if (OpencertsRegistryVerificationValidDataArray.guard(issuerFragments)) {
      return {
        type,
        name,
        status: 'VALID',
        data: issuerFragments,
      };
    }

    throw new CodedError(
      'Unable to retrieve the reason of the failure',
      OpencertsRegistryCode.UNEXPECTED_ERROR,
      'UNEXPECTED_ERROR',
    );
  },
};

export const isValidOpenCert = (
  verificationFragments: VerificationFragment[],
  types: VerificationFragmentType[] = ['DOCUMENT_STATUS', 'DOCUMENT_INTEGRITY', 'ISSUER_IDENTITY'],
) => {
  if (verificationFragments.length < 1) {
    throw new Error('Please provide at least one verification fragment to check');
  }
  if (types.length < 1) {
    throw new Error('Please provide at least one type to check');
  }
  return types.every((currentType) => {
    const verificationFragmentsForType = verificationFragments.filter(
      (fragment) => fragment.type === currentType,
    );

    // return true if at least one fragment is valid
    // and all fragments are valid or skipped
    const defaultCheck = oaIsValid(verificationFragments, [currentType]);
    // return defaultCheck if it's true or if type is DOCUMENT_INTEGRITY or DOCUMENT_STATUS
    if (currentType === 'DOCUMENT_STATUS' || currentType === 'DOCUMENT_INTEGRITY' || defaultCheck) {
      return defaultCheck;
    }

    // if default check is false and type is issuer identity we check whether at least one verifier is valid
    const issuerIdentityFragments = verificationFragmentsForType.filter(
      (fragment) => fragment.type === 'ISSUER_IDENTITY',
    );
    return issuerIdentityFragments.some((fragment) => fragment.status === 'VALID');
  });
};

export const getOpencertsRegistryVerifierFragment =
  ttVerifyUtils.getFragmentByName<OpencertsRegistryVerifierVerificationFragment>(name);

export const verifyOpenCertSignature = (builderOptions: VerificationBuilderOptions) =>
  verificationBuilder([...openAttestationVerifiers, registryVerifier], builderOptions);
