import { recentRegistrySubjects } from "@/lib/registry/repository";

const labels: Record<string, string> = { company: "Company", application: "Application", mcp_server: "MCP server", skill: "Skill", agent: "Agent", model: "Model", api: "API", developer_tool: "Developer tool" };

export default async function RegistryPage() {
  const subjects = await recentRegistrySubjects();
  return (
    <div className="mx-auto max-w-6xl">
      <p className="eyebrow">Canonical index</p><h1 className="mt-3 text-3xl font-semibold tracking-[-.035em]">Registry</h1>
      <p className="muted mt-3 max-w-[68ch] leading-7">Companies and typed AI products share stable identities while retaining their own risk and capability metadata.</p>
      <div className="mt-10 overflow-x-auto border-y border-[var(--line)]">
        <table className="w-full min-w-[680px] border-collapse text-left text-sm"><thead className="text-[var(--muted)]"><tr><th className="py-3 pr-5 font-medium">Subject</th><th className="px-5 py-3 font-medium">Type</th><th className="px-5 py-3 font-medium">Verification</th><th className="pl-5 py-3 text-right font-medium">Added</th></tr></thead><tbody className="divide-y divide-[var(--line)]">{subjects.length ? subjects.map((subject) => <tr key={`${subject.subjectType}-${subject.id}`}><td className="py-4 pr-5 font-medium">{subject.name}</td><td className="px-5 py-4 text-[var(--muted)]">{labels[subject.subjectType === "company" ? "company" : subject.kind] ?? subject.kind}</td><td className="px-5 py-4"><span className="rounded-full bg-[var(--surface-raised)] px-2.5 py-1 text-xs">{subject.verification.replaceAll("_", " ")}</span></td><td className="pl-5 py-4 text-right text-[var(--muted)]">{subject.createdAt.toLocaleDateString("en-AU")}</td></tr>) : <tr><td colSpan={4} className="py-16 text-center"><strong className="font-medium">The registry is ready for its first subject.</strong><span className="muted mt-2 block">Use the REST API to add a company or product from an authorised workspace.</span></td></tr>}</tbody></table>
      </div>
    </div>
  );
}
