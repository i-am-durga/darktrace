import { describe, expect, it } from "vitest";
import { parseIngestionFile } from "./parse";

describe("parseIngestionFile", () => {
  it("normalizes a valid JSON payload with actors and observations", () => {
    const result = parseIngestionFile("records.json", JSON.stringify({
      actors: [{ canonical_name: "Training Actor" }],
      observations: [{
        actor_name: "Training Actor",
        source: { name: "Authorized Dataset", type: "public_dataset" },
        title: "Public report note",
        content: "Fictional test content.",
        observation_type: "analyst_note",
      }],
    }));

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.actors[0]?.category).toBe("unknown");
    expect(result.data.observations[0]?.source.trust_level).toBe("medium");
  });

  it("parses quoted CSV fields and creates an actor from an observation row", () => {
    const csv = [
      "actor_name,actor_category,source_name,source_type,title,content,observation_type",
      '"Training Actor",forum,"Authorized Dataset",public_dataset,"Public note","Contains, a comma",analyst_note',
    ].join("\n");
    const result = parseIngestionFile("records.csv", csv);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.actors).toHaveLength(1);
    expect(result.data.observations[0]?.content).toBe("Contains, a comma");
  });

  it("rejects unsupported enum values instead of storing them", () => {
    const result = parseIngestionFile("records.json", JSON.stringify({
      actors: [{ canonical_name: "Training Actor", category: "criminal" }],
    }));

    expect(result.success).toBe(false);
  });

  it("rejects non-HTTP source URLs", () => {
    const result = parseIngestionFile("records.json", JSON.stringify({
      observations: [{
        source: { name: "Untrusted Reference", type: "analyst_input", url: "javascript:alert(1)" },
        title: "Reference",
        content: "No URL fetch is performed.",
        observation_type: "analyst_note",
      }],
    }));

    expect(result.success).toBe(false);
  });

  it("rejects files with more than 200 actor/observation records", () => {
    const observations = Array.from({ length: 201 }, (_, index) => ({
      source: { name: "Authorized Dataset", type: "public_dataset" },
      title: `Observation ${index}`,
      content: "Training content.",
      observation_type: "analyst_note",
    }));
    const result = parseIngestionFile("records.json", JSON.stringify({ observations }));

    expect(result.success).toBe(false);
  });

  it("rejects malformed JSON", () => {
    expect(parseIngestionFile("records.json", "{not-json").success).toBe(false);
  });

  it("successfully parses the authorized sample CSV file", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const sampleCsv = fs.readFileSync(path.resolve(process.cwd(), "public/samples/authorized_threat_intel_sample.csv"), "utf8");
    const result = parseIngestionFile("authorized_threat_intel_sample.csv", sampleCsv);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.actors.length).toBeGreaterThan(0);
      expect(result.data.observations.length).toBe(8);
    }
  });

  it("successfully parses the authorized sample JSON file", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const sampleJson = fs.readFileSync(path.resolve(process.cwd(), "public/samples/authorized_threat_intel_sample.json"), "utf8");
    const result = parseIngestionFile("authorized_threat_intel_sample.json", sampleJson);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.actors.length).toBe(3);
      expect(result.data.observations.length).toBe(4);
    }
  });

  it("normalizes mixed-case and spaced categories and statuses in CSV", () => {
    const csv = [
      "actor_name,actor_category,actor_status,source_name,source_type,title,content,observation_type",
      '"APT-Fox","Credential Seller","Active","Advisory Feed","Public Dataset","Breach listing","Sample breach","Listing"',
    ].join("\n");
    const result = parseIngestionFile("test.csv", csv);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.actors[0]?.category).toBe("credential_seller");
      expect(result.data.actors[0]?.status).toBe("active");
      expect(result.data.observations[0]?.observation_type).toBe("listing");
      expect(result.data.observations[0]?.source.type).toBe("public_dataset");
    }
  });
});

