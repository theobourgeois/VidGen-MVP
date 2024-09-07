import { useEffect, useState } from "react";

const MAX_CHAR_LENGTH = 2000;

const voices = {
    Adam: "pNInz6obpgDQGcFmaJgB",
    Antoni: "ErXwobaYiN019PkySvjV",
    Arnold: "VR6AewLTigWG4xSOukaG",
    Clyde: "2EiwWnXFnvU5JabPnv8n",
    Dave: "CYw3kZ02Hs0563khs1Fj",
    Dorothy: "ThT5KcBeYPX3keUQqHPh",
    Drew: "29vD33N1CtxCmqQRPOHJ",
    Emily: "LcfcDJNUP1GQjkzn1xUU",
    Ethan: "g5CIjZEefAph4nQFvHAz",
    Fin: "D38z5RcWu1voky8WS1ja",
    Sarah: "EXAVITQu4vr4xnSDxMaL",
    Laura: "FGY2WhTYpPnrIDTdsKH5",
    Charlie: "IKne3meq5aSn9XLyUdCD",
    George: "JBFqnCBsd6RMkjVDRZzb",
    Callum: "N2lVS1w4EtoT3dr4eOWO",
    Liam: "TX3LPaxmHKxFdv7VOQHJ",
    Charlotte: "XB0fDUnXU5powFXDhCwa",
    Alice: "Xb7hH8MSUJpSbSDYk0k2",
    Matilda: "XrExE9yKIg1WjnnlVkGX",
    Will: "bIHbv24MWmeRgasZH58o",
    Jessica: "cgSgspJ2msm6clMCkdW9",
    Eric: "cjVigY5qzO86Huf0OWal",
    Chris: "iP95p4xoKVk53GoZ742B",
    Brian: "nPczCjzI2devNBz1zQrb",
    Daniel: "onwK4e9ZLuTAKqWW03F9",
    Lily: "pFZP5JQG7iQjIQuC4Bku",
    Bill: "pqHfZKP75CvOlQylNhV4",
};

function App() {
    const [url, setURL] = useState<string>("");
    const [text, setText] = useState<string>("Hello!");
    const [apiKey, setApiKey] = useState<string>("");
    const [voiceId, setVoiceId] = useState<string>("pqHfZKP75CvOlQylNhV4");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isShowingApiKey, setIsShowingApiKey] = useState<boolean>(false);
    const [wordsPerCaption, setWordsPerCaption] = useState<number>(1);

    const isButtonDisabled =
        !text || !apiKey || isLoading || text.length > MAX_CHAR_LENGTH;

    const handleFetch = async () => {
        setIsLoading(true);
        const escapedText = text.replace(/[\\%':]+/g, "");
        const res = await fetch("http://localhost:3000/makevideo", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                text: escapedText,
                apiKey,
                voiceId,
                wordsPerCaption,
            }),
        });

        const data = await res.json();
        setURL(data.base64Url);
        setIsLoading(false);
    };

    const handleChangeApiKey = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setApiKey(value);
        if (localStorage.getItem("apiKey") !== value) {
            localStorage.setItem("apiKey", value);
        }
    };

    useEffect(() => {
        const apiKey = localStorage.getItem("apiKey");
        if (apiKey) {
            setApiKey(apiKey);
        }
    }, []);

    return (
        <div>
            <header className="p-2">
                <h1 className="text-4xl font-bold">
                    Vid<span className="text-red-600">Gen</span>
                </h1>
                <p>
                    Generate short-form videos with text-to-speech and captions.
                    Powered by ElevenLabs.{" "}
                    <span className="text-red-600">
                        More features coming soon...
                    </span>
                </p>
            </header>
            <main>
                <div className="flex flex-col gap-2 m-4">
                    <div className="flex flex-col">
                        <label htmlFor="text" className="font-semibold">
                            Text
                        </label>
                        <textarea
                            className="rounded-sm p-2 bg-gray-100"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                        ></textarea>
                    </div>
                    <div className="flex flex-col">
                        <label
                            htmlFor="text"
                            className="font-semibold flex gap-2 items-center"
                        >
                            ElevenLabs API Key{" "}
                            <a
                                href="https://www.youtube.com/watch?v=EDsiFLo6mLE"
                                className="underline cursor-pointer text-sm text-red-500"
                            >
                                How to get
                            </a>
                        </label>
                        <div className="relative">
                            <input
                                className="rounded-sm p-2 bg-gray-100 w-full"
                                type={isShowingApiKey ? "text" : "password"}
                                value={apiKey}
                                onChange={handleChangeApiKey}
                            />
                            <button
                                className="absolute right-1 top-1 bg-gray-200 px-2 py-1 rounded-sm"
                                onClick={() =>
                                    setIsShowingApiKey((prev) => !prev)
                                }
                            >
                                {isShowingApiKey ? "Hide" : "Show"}
                            </button>
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <label
                            htmlFor="text"
                            className="font-semibold flex gap-2 items-center"
                        >
                            Number of words per caption
                        </label>
                        <input
                            className="rounded-sm p-2 bg-gray-100"
                            type="number"
                            value={wordsPerCaption}
                            onChange={(e) =>
                                setWordsPerCaption(+e.target.value)
                            }
                        />
                    </div>
                    <div className="flex flex-col">
                        <label
                            htmlFor="text"
                            className="font-semibold flex gap-2 items-center"
                        >
                            Voice
                        </label>
                        <select
                            value={voiceId}
                            className="px-2 py-1 rounded-sm bg-gray-100"
                            onChange={(e) => setVoiceId(e.target.value)}
                        >
                            {Object.keys(voices).map((voice) => (
                                <option
                                    key={voice}
                                    value={voices[voice as keyof typeof voices]}
                                >
                                    {voice}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        className="w-max bg-red-600 font-bold rounded-md py-1 px-4 text-white disabled:opacity-50"
                        onClick={handleFetch}
                        disabled={isButtonDisabled}
                    >
                        {isLoading ? "Loading..." : "Generate Video"}
                    </button>
                </div>
                {Boolean(url) && (
                    <div className="flex justify-center items-center">
                        <video src={url} controls className="h-[500px]"></video>
                    </div>
                )}
                <footer className="mt-8 mb-4">
                    <p className="text-center font-semibold">
                        Made by{" "}
                        <a
                            href="https://theobourgeois.com"
                            className="text-red-600 hover:underline"
                        >
                            Théo Bourgeois
                        </a>
                    </p>
                    <p className="text-center">
                        Visit source code on GitHub{" "}
                        <a
                            className="text-red-600 hover:underline"
                            href="
                            https://github.com/theobourgeois/vidgen"
                        >
                            here
                        </a>
                    </p>
                </footer>
            </main>
        </div>
    );
}

export default App;
