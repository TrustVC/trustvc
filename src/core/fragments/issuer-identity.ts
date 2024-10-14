import { Verifier } from '@govtechsg/oa-verify';
import { Resolver } from 'did-resolver';
import { getResolver as getWebDidResolver } from 'web-did-resolver';

const checkDidWebResolve = async (did: string): Promise<boolean> => {
  try {
    const resolver = new Resolver({
      ...getWebDidResolver(),
    });

    const didDocument = await resolver.resolve(did);

    if (!didDocument || !didDocument.didDocument) {
      throw new Error(`Failed to resolve DID: ${did}`);
    }

    return true;
  } catch {
    return false;
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const w3cIssuerIdentity: Verifier<any> = {
  skip: async () => {
    return {
      type: 'ISSUER_IDENTITY',
      name: 'W3CIssuerIdentity',
      reason: {
        code: 0,
        codeString: 'SKIPPED',
        message: `Document has no issuer field.`,
      },
      status: 'SKIPPED',
    };
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  test: (document: any) => document.issuer,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  verify: async (document: any) => {
    if (document.proof?.verificationMethod?.split('#')[0] !== document.issuer) {
      return {
        type: 'ISSUER_IDENTITY',
        name: 'W3CIssuerIdentity',
        data: false,
        reason: {
          message: `Issuer and verification method do not match.`,
        },
        status: 'INVALID',
      };
    }
    const resolutionResult = await checkDidWebResolve(document.issuer);

    if (resolutionResult) {
      return {
        type: 'ISSUER_IDENTITY',
        name: 'W3CIssuerIdentity',
        data: true,
        status: 'VALID',
      };
    } else {
      return {
        type: 'ISSUER_IDENTITY',
        name: 'W3CIssuerIdentity',
        data: false,
        reason: {
          message: `The DID cannot be resolved.`,
        },
        status: 'INVALID',
      };
    }
  },
};
