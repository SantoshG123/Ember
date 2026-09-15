"use client"

import { useEffect, useRef, useState, type ComponentProps } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { accountProfileSchema, sellerProfileSchema, type AccountProfile } from "@/lib/account-profile-schema"
import { ProfileError, useAccountProfile, useSaveAccountProfile } from "@/lib/account-profile"

const capabilities = (text: string) => text.split("\n").map(value => value.trim()).filter(Boolean)
const formSchema = z.object({
  name: accountProfileSchema.shape.name,
  summary: sellerProfileSchema.shape.summary,
  serviceArea: sellerProfileSchema.shape.serviceArea,
  capabilitiesText: z.string().max(400).refine(value => sellerProfileSchema.shape.capabilities.safeParse(capabilities(value)).success, "Add up to 8 unique capabilities, one per line, with no more than 40 characters each."),
})
type Fields = z.infer<typeof formSchema>
const defaults = (profile: AccountProfile): Fields => ({
  name: profile.name, summary: profile.seller?.summary ?? "", serviceArea: profile.seller?.serviceArea ?? "",
  capabilitiesText: profile.seller?.capabilities.join("\n") ?? "",
})

function ProfileForm({ profile, accountId, onSaved, onDirty, onBusy, discard, cancelDiscard, close, discardChanges }: {
  profile: AccountProfile; accountId: string; onSaved: () => void; onDirty: (value: boolean) => void; onBusy: (value: boolean) => void;
  discard: boolean; cancelDiscard: () => void; close: () => void; discardChanges: () => void;
}) {
  const save = useSaveAccountProfile(accountId)
  const query = useAccountProfile(accountId)
  const [version, setVersion] = useState(profile.version)
  const warning = useRef<HTMLParagraphElement>(null)
  const { register, handleSubmit, reset, setFocus, formState: { errors, isDirty } } = useForm<Fields>({ resolver: zodResolver(formSchema), defaultValues: defaults(profile), mode: "onBlur" })
  useEffect(() => { onDirty(isDirty) }, [isDirty, onDirty])
  useEffect(() => { onBusy(save.isPending || query.isFetching) }, [save.isPending, query.isFetching, onBusy])
  useEffect(() => { if (discard) warning.current?.focus() }, [discard])
  useEffect(() => {
    if (!isDirty) return
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = "" }
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [isDirty])

  const conflict = save.error instanceof ProfileError && save.error.status === 409
  async function reload() {
    const result = await query.refetch()
    if (result.data && !result.isError) { reset(defaults(result.data)); setVersion(result.data.version); save.reset(); cancelDiscard() }
  }
  async function submit(fields: Fields) {
    try {
      await save.mutateAsync({ name: fields.name, version, ...(profile.seller ? { seller: { summary: fields.summary, serviceArea: fields.serviceArea, capabilities: capabilities(fields.capabilitiesText) } } : {}) })
      onSaved()
    } catch { /* Keep the draft and announce the error. */ }
  }
  return <form className="mt-7 space-y-5" onSubmit={handleSubmit(submit)} noValidate>
    {discard ? <div className="rounded-lg border border-divider bg-muted p-4"><p ref={warning} tabIndex={-1} role="alert" className="text-sm font-semibold focus-visible:outline-2 focus-visible:outline-ember">Discard your unsaved changes?</p><div className="mt-3 flex flex-wrap gap-3"><Button type="button" variant="outline" onClick={() => { cancelDiscard(); setFocus("name") }}>Keep editing</Button><Button type="button" variant="ember" onClick={discardChanges}>Discard changes</Button></div></div> : null}
    <fieldset disabled={save.isPending || query.isFetching} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="profile-name">Display name <span className="text-subtle">(required)</span></Label>
        <Input id="profile-name" autoComplete="nickname" maxLength={80} aria-invalid={Boolean(errors.name)} aria-describedby="profile-name-help profile-name-error" {...register("name")} />
        <p id="profile-name-help" className="text-xs leading-relaxed text-subtle">Shown on your requests, proposals, and conversations. 2–80 characters.</p>
        <p id="profile-name-error" role={errors.name ? "alert" : undefined} className="text-sm text-ember-ink">{errors.name?.message}</p>
      </div>
      {profile.seller ? <fieldset className="space-y-5 border-t border-divider pt-5">
        <legend className="px-2 text-sm font-semibold">Seller introduction</legend>
        <p className="text-sm leading-relaxed text-subtle">Optional details buyers can see with your proposals. These are self-described, not verified by EMBER.</p>
        <div className="space-y-2"><Label htmlFor="profile-area">Service area</Label><Input id="profile-area" maxLength={120} placeholder="Austin, TX · Remote" aria-invalid={Boolean(errors.serviceArea)} aria-describedby="profile-area-error" {...register("serviceArea")} /><p id="profile-area-error" role={errors.serviceArea ? "alert" : undefined} className="text-sm text-ember-ink">{errors.serviceArea?.message}</p></div>
        <div className="space-y-2"><Label htmlFor="profile-summary">Short introduction</Label><Textarea id="profile-summary" maxLength={600} aria-invalid={Boolean(errors.summary)} aria-describedby="profile-summary-help profile-summary-error" {...register("summary")} /><p id="profile-summary-help" className="text-xs text-subtle">What do you offer? Up to 600 characters. Do not include private contact details.</p><p id="profile-summary-error" role={errors.summary ? "alert" : undefined} className="text-sm text-ember-ink">{errors.summary?.message}</p></div>
        <div className="space-y-2"><Label htmlFor="profile-capabilities">Capabilities</Label><Textarea id="profile-capabilities" maxLength={400} placeholder={"Meal preparation\nWeekly delivery"} aria-invalid={Boolean(errors.capabilitiesText)} aria-describedby="profile-capabilities-help profile-capabilities-error" {...register("capabilitiesText")} /><p id="profile-capabilities-help" className="text-xs leading-relaxed text-subtle">One per line. Up to 8 unique capabilities, 40 characters each.</p><p id="profile-capabilities-error" role={errors.capabilitiesText ? "alert" : undefined} className="text-sm text-ember-ink">{errors.capabilitiesText?.message}</p></div>
      </fieldset> : null}
    </fieldset>
    {save.error ? <div role="alert" className="rounded-lg border border-divider bg-muted p-4 text-sm leading-relaxed"><p>{save.error.message}</p>{conflict ? <><p className="mt-2 text-subtle">Copy any draft text you want to keep. Reloading replaces these fields with the latest saved version.</p><Button type="button" className="mt-3" variant="outline" disabled={query.isFetching} onClick={() => void reload()}>{query.isFetching ? "Reloading…" : "Replace draft with latest"}</Button></> : null}</div> : null}
    {query.isError ? <p role="alert" className="text-sm text-ember-ink">Could not reload your profile. Your draft is unchanged; try again.</p> : null}
    <div className="flex flex-col-reverse gap-3 border-t border-divider pt-5 sm:flex-row sm:justify-end"><Button type="button" variant="outline" disabled={save.isPending || query.isFetching} onClick={close}>Cancel</Button><Button type="submit" variant="ember" disabled={!isDirty || save.isPending || query.isFetching || conflict}>{save.isPending ? "Saving profile…" : "Save changes"}</Button></div>
  </form>
}

function ProfileContent(props: Omit<ComponentProps<typeof ProfileForm>, "profile">) {
  const query = useAccountProfile(props.accountId)
  if (query.isPending) return <p role="status" className="mt-7 text-sm text-subtle">Loading your profile…</p>
  if (!query.data) return <div className="mt-7"><p role="alert" className="text-sm">{query.error?.message ?? "Profile unavailable."}</p><Button variant="outline" className="mt-4" disabled={query.isFetching} onClick={() => void query.refetch()}>Try again</Button></div>
  return <ProfileForm {...props} profile={query.data} />
}

export function AccountProfileEditor({ accountId }: { accountId: string }) {
  const [open, setOpen] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [busy, setBusy] = useState(false)
  const [discard, setDiscard] = useState(false)
  const [notice, setNotice] = useState("")
  function discardChanges() { if (!busy) { setOpen(false); setDirty(false); setDiscard(false) } }
  function close() {
    if (busy) return
    if (dirty) { setDiscard(true); return }
    discardChanges()
  }
  return <div className="mt-6">
    <Dialog open={open} onOpenChange={value => { if (value) { setNotice(""); setOpen(true) } else close() }}>
      <DialogTrigger asChild><Button variant="outline" className="w-full"><Pencil aria-hidden="true" className="size-4" />Edit public profile</Button></DialogTrigger>
      <DialogContent onInteractOutside={event => { event.preventDefault() }} onEscapeKeyDown={event => { event.preventDefault(); close() }}>
        <DialogHeader><DialogTitle>Your public profile</DialogTitle><DialogDescription>Help people recognize you across EMBER. Your email, account roles, and verification status cannot be changed here.</DialogDescription></DialogHeader>
        {open ? <ProfileContent accountId={accountId} onDirty={setDirty} onBusy={setBusy} discard={discard} cancelDiscard={() => setDiscard(false)} close={close} discardChanges={discardChanges} onSaved={() => { setOpen(false); setDirty(false); setBusy(false); setDiscard(false); setNotice("Public profile saved.") }} /> : null}
      </DialogContent>
    </Dialog>
    <p role="status" aria-live="polite" className="mt-3 text-sm leading-relaxed">{notice}</p>
  </div>
}
