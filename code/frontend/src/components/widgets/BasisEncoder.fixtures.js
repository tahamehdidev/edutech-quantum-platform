// Matches the real seed content exactly (QML, "From Bits to Circuits: Encoding Data" > "Basis
// Encoding"): the lesson's own prose walks through "the number 6 in binary is 110 -- basis-encode
// it across 3 qubits and you get the state |110⟩" -- defaultNumber/qubitCount below are that
// exact worked example, so the widget opens already showing the case the reader just read about.
export const basisEncoderParams = {
  caption: "Try a different number -- the encoding updates live.",
  defaultNumber: 6,
  qubitCount: 3,
};
