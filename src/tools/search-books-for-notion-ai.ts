import { Tool } from "@raycast/api";

type Input = {
  /** The description for the input property */
  query: string;
};

export default async function (input: Input) {
  console.log("input", input);
  // Your tool code here
}

export const confirmation: Tool.Confirmation<Input> = async (input) => {
  console.log("input", input);
  return {
    title: "Run Tool",
  };
};
