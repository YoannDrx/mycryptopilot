"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FormField, FormItem, useZodForm } from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InlineTooltip } from "@/components/ui/tooltip";
import { Typography } from "@/components/ui/typography";
import { FormUnsavedBar } from "@/features/form/FormUnsavedBar";
import { OrganizationMembershipRole } from "@prisma/client";
import { useMutation } from "@tanstack/react-query";
import { Mail, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateOrganizationMemberAction } from "../org.action";
import type { OrgMemberFormSchemaType } from "../org.schema";
import { OrgMemberFormSchema } from "../org.schema";
import { OrganizationInviteMemberForm } from "./OrganizationInviteMemberForm";

type ProductFormProps = {
  defaultValues: OrgMemberFormSchemaType;
  members: {
    id: string;
    name: string | null;
    email: string;
    image?: string | null;
  }[];
};

export const OrganizationMembersForm = ({
  defaultValues,
  members,
}: ProductFormProps) => {
  const form = useZodForm({
    schema: OrgMemberFormSchema,
    defaultValues,
  });
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: async (values: OrgMemberFormSchemaType) => {
      const result = await updateOrganizationMemberAction(values);

      if (!result || result.serverError) {
        toast.error("Failed to update settings");
        throw new Error("Failed to update settings");
      }

      router.refresh();
      form.reset(result.data as OrgMemberFormSchemaType);
    },
  });

  return (
    <FormUnsavedBar
      form={form}
      onSubmit={async (v) => mutation.mutateAsync(v)}
      className="flex w-full flex-col gap-6 lg:gap-8"
    >
      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>
            People who have access to your organization.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {form.getValues("members")?.map((baseMember, index) => {
            const member = members.find((m) => m.id === baseMember.id);
            if (!member) {
              return null;
            }
            return (
              <div key={member.id}>
                <div className="flex items-center gap-2">
                  <Avatar>
                    <AvatarFallback>{member.email.slice(0, 2)}</AvatarFallback>
                    {member.image ? <AvatarImage src={member.image} /> : null}
                  </Avatar>
                  <div>
                    <Typography variant="large">{member.name}</Typography>
                    <Typography variant="muted">{member.email}</Typography>
                  </div>
                  <div className="flex-1"></div>
                  {baseMember.role === "OWNER" ? (
                    <InlineTooltip title="You can't change the role of an owner">
                      <Button type="button" variant="outline">
                        OWNER
                      </Button>
                    </InlineTooltip>
                  ) : (
                    <FormField
                      control={form.control}
                      name={`members.${index}.role`}
                      render={({ field }) => (
                        <FormItem>
                          <Select
                            value={field.value}
                            onValueChange={(v) => {
                              field.onChange(v);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.values(OrganizationMembershipRole).map(
                                (role) => {
                                  return (
                                    <SelectItem key={role} value={role}>
                                      {role}
                                    </SelectItem>
                                  );
                                },
                              )}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  )}

                  <Button
                    type="button"
                    disabled={baseMember.role === "OWNER"}
                    variant="outline"
                    onClick={() => {
                      const newMembers = [...form.getValues("members")].filter(
                        (m) => m.id !== member.id,
                      );

                      form.setValue("members", newMembers, {
                        shouldDirty: true,
                      });
                    }}
                  >
                    <X size={16} />
                    <span className="sr-only">Remove member</span>
                  </Button>
                </div>
              </div>
            );
          })}
          <Dialog>
            <DialogTrigger asChild>
              <Button type="button" variant="outline">
                <Mail className="mr-2" size={16} />
                Invite member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite member</DialogTitle>
              </DialogHeader>
              <OrganizationInviteMemberForm />
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </FormUnsavedBar>
  );
};
