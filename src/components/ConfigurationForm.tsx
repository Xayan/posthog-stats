import * as React from 'react';
import { useForm } from '@tanstack/react-form';
import { z } from 'zod';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ApiConfig {
  projectId: string;
  apiKey: string;
  baseUrl: string;
}

interface ConfigurationFormProps {
  onSubmit: (values: ApiConfig) => void;
  isLoading: boolean;
  initialValues: ApiConfig; // New prop to pre-fill the form
}

export const ConfigurationForm = ({ onSubmit, isLoading, initialValues }: ConfigurationFormProps) => {
  const form = useForm({
    defaultValues: initialValues, // Use initialValues to set the form's default state
    onSubmit: async ({ value }) => {
      onSubmit(value);
    },
  });

  return (
    <Card className="max-w-2xl mx-auto">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
          <CardDescription>Provide your PostHog Project ID, Personal API Key, and instance URL.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form.Field
            name="projectId"
            validators={{
              onChange: ({ value }) => {
                const schema = z.string().min(1, 'Project ID is required.');
                const result = schema.safeParse(value);
                if (!result.success) {
                  return result.error.issues[0].message;
                }
              },
            }}
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Project ID</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Your PostHog Project ID"
                />
                {field.state.meta.errors?.[0] ? (
                  <em className="text-destructive text-sm">{String(field.state.meta.errors[0])}</em>
                ) : null}
              </div>
            )}
          />
          <form.Field
            name="apiKey"
            validators={{
              onChange: ({ value }) => {
                const schema = z.string().min(1, 'API Key is required.');
                const result = schema.safeParse(value);
                if (!result.success) {
                  return result.error.issues[0].message;
                }
              },
            }}
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Personal API Key</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  type="password"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Your PostHog API Key"
                />
                {field.state.meta.errors?.[0] ? (
                  <em className="text-destructive text-sm">{String(field.state.meta.errors[0])}</em>
                ) : null}
              </div>
            )}
          />
          <form.Field
            name="baseUrl"
            validators={{
              onChange: ({ value }) => {
                const schema = z.string().url('Please enter a valid URL.');
                const result = schema.safeParse(value);
                if (!result.success) {
                  return result.error.issues[0].message;
                }
              },
            }}
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>PostHog URL</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="e.g., https://app.posthog.com"
                />
                {field.state.meta.errors?.[0] ? (
                  <em className="text-destructive text-sm">{String(field.state.meta.errors[0])}</em>
                ) : null}
              </div>
            )}
          />
        </CardContent>
        <CardFooter>
            <form.Subscribe
                selector={(state) => [state.canSubmit, state.isSubmitting]}
                children={([canSubmit, isSubmitting]) => (
                    <Button type="submit" disabled={!canSubmit || isSubmitting || isLoading}>
                        {isLoading ? "Connecting..." : "Load Saved Queries"}
                    </Button>
                )}
            />
        </CardFooter>
      </form>
    </Card>
  );
};

I have not yet reviewed the code.

Previous agent, while it did a monumental amount of work, ended on 2 seemingly tiny errors, and the whole task was deemed as failure.

So now I need you to fix these 2 remaining issues: