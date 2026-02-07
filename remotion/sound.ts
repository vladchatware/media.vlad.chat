const args = process.argv;

if (args.length < 3) {
  console.log("Please provide a text argument.");
} else {
  const inputText = args[2];
  const name = args[3];

  // const file = await speech(inputText)

  await Bun.$`node kokoro.js ${inputText} ${name}`;
}

export {};
