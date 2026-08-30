import { PushClient } from "../client";
import { MessageTag } from "../models";

jest.mock("../../logging", () => {
    const stub = { error: jest.fn(), debug: jest.fn(), info: jest.fn(), warn: jest.fn(), trace: jest.fn() };
    return new Proxy({}, { get: () => stub });
});

/**
 * The received-message ids are echoed back to the server on login so it does not redeliver them, and
 * are handed to the consumer to persist. They used to grow without bound for the whole life of a
 * connection: memory that is also serialised into the consumer's storage and into every login
 * request. Only the most recent ones can still be pending redelivery.
 */
describe("PushClient persistent ids", () => {
    const max = (PushClient as unknown as { MAX_PERSISTENT_IDS: number }).MAX_PERSISTENT_IDS;

    // The real constructor opens sockets and loads protos; drive the message handler against a bare
    // instance with just the collaborators it touches stubbed out.
    const make = (): PushClient => {
        const client = Object.create(PushClient.prototype) as PushClient;
        Object.assign(client, {
            persistentIds: [],
            resetCurrentDelay: () => undefined,
            convertPayloadMessage: () => ({}),
            emit: () => true,
        });
        return client;
    };

    const receive = (client: PushClient, id: string) =>
        (client as unknown as { handleParsedMessage: (m: unknown) => void }).handleParsedMessage({
            tag: MessageTag.DataMessageStanza,
            object: { persistentId: id },
        });

    it("keeps only the most recent ids as messages arrive", () => {
        const client = make();
        for (let i = 0; i < max + 50; i++) receive(client, `id-${i}`);

        expect(client.getPersistentIds()).toHaveLength(max);
        expect(client.getPersistentIds()[0]).toBe("id-50");
        expect(client.getPersistentIds()[max - 1]).toBe(`id-${max + 49}`);
    });

    it("trims an oversized list restored from persisted data", () => {
        const client = make();
        client.setPersistentIds(Array.from({ length: max + 500 }, (_, i) => `id-${i}`));

        expect(client.getPersistentIds()).toHaveLength(max);
        expect(client.getPersistentIds()[max - 1]).toBe(`id-${max + 499}`);
    });
});
