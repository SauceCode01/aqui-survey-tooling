import { ExpressRoute } from "@solid-stack/agnos-express";
import { type DepsType, MakeInjectable } from "@solid-stack/di";
import type { Request, Response } from "express";
import { z } from "zod";
import { CreateFormSubmission } from "../../useCases/CreateFormSubmission.js";

export type HttpResponseStatus =
  | "info"
  | "success"
  | "redirect"
  | "fail"
  | "error";

export interface HttpResponse<T = object> {
  status: HttpResponseStatus;
  message: string;
  data?: T;
}

const QuestionGeneralSchema = z.object({
    question: z.string(),
    questionType: z.string(),
});

const StringAnswerSchema = QuestionGeneralSchema.extend({
    answerType: z.literal("string"),
    answer: z.string(),
});

const StringArrAnswerSchema = QuestionGeneralSchema.extend({
    answerType: z.literal("string[]"),
    answer: z.array(z.string()),
});

const StringArrArrAnswerSchema = QuestionGeneralSchema.extend({
    answerType: z.literal("string[][]"),
    answer: z.array(z.array(z.string())),
});

// Use discriminatedUnion since answerType uniquely identifies the shape
export const QuestionAnswerSchema = z.discriminatedUnion("answerType", [
    StringAnswerSchema,
    StringArrAnswerSchema,
    StringArrArrAnswerSchema,
]);

// The final schema for QuestionAnswer[]
export const QuestionAnswersArraySchema = z.array(QuestionAnswerSchema);

const createFormSubmissionHttpSchema = z.object({
  body: z.object({
    data: z.object({
      email: z.string(),
      answers: QuestionAnswersArraySchema,
      sourceKey: z.string(),
    }),
  }),
});

@MakeInjectable
export default class CreateFormSubmissionHttp extends ExpressRoute {
  public static deps = {
    createFormSubmission: CreateFormSubmission,
  };

  constructor(public deps: DepsType<typeof CreateFormSubmissionHttp.deps>) {
    super();
  }

  public method = "post" as const;
  public path = "/";
  public handler = async (req: Request, res: Response) => {
    const parsed = createFormSubmissionHttpSchema.safeParse({
      body: req.body,
    });
    if (!parsed.success) {
      return res.status(400).json({
        status: "error",
        message: "Validation failed",
        data: parsed.error.format(),
      });
    }
    const result = await this.deps.createFormSubmission.execute({
      createDto: {
        email: parsed.data.body.data.email,
        answers: parsed.data.body.data.answers,
      },
      sourceKey: parsed.data.body.data.sourceKey,
    });
    return res.status(201).json({
      status: "success",
      message: "FormSubmission created successfully",
      data: {
        id: result.formSubmission.id,
        email: result.formSubmission.email,
      },
    });
  };
}
