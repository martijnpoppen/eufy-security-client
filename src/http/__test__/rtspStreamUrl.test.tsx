import { EufySecurity } from "../../eufysecurity";
import { PropertyName } from "../types";

jest.mock("../../logging", () => {
    const stub = { error: jest.fn(), debug: jest.fn(), info: jest.fn(), warn: jest.fn(), trace: jest.fn() };
    return new Proxy({}, { get: () => stub });
});

/**
 * rtspStream is reported by cameras that have no rtspStreamUrl property at all (a SoloCamera that is
 * not a C35, for one). Clearing the url on every "rtspStream turned off" threw InvalidPropertyError
 * for those, on every property refresh — a thrown stack trace and a fat error log, repeatedly, for a
 * property the device never had.
 */
describe("onDevicePropertyChanged - clearing the RTSP url", () => {
    const run = (hasUrlProperty: boolean) => {
        const setCustomPropertyValue = jest.fn();
        const device = {
            hasProperty: (name: string) => (name === PropertyName.DeviceRTSPStreamUrl ? hasUrlProperty : true),
            getPropertyValue: () => undefined,
            setCustomPropertyValue,
            getSerial: () => "T86P252024310C91",
            getStationSerial: () => "T86P252024310C91",
        };
        const eufy = Object.create(EufySecurity.prototype) as EufySecurity;
        Object.assign(eufy, { emit: () => true });
        (eufy as unknown as { onDevicePropertyChanged: (...a: unknown[]) => void }).onDevicePropertyChanged(
            device,
            PropertyName.DeviceRTSPStream,
            false,
            false
        );
        return setCustomPropertyValue;
    };

    it("clears it on a device that has the property", () => {
        expect(run(true)).toHaveBeenCalledWith(PropertyName.DeviceRTSPStreamUrl, "");
    });

    it("leaves a device that has no such property alone", () => {
        expect(run(false)).not.toHaveBeenCalled();
    });
});
