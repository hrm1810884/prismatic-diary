/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import { Button, Textarea } from "@mantine/core";
import { useEffect, useRef } from "react";

import { useExperenceStates, useTyping } from "@/states";

import { demoInput } from "./consts";
import { useStreamer } from "./hooks";

import { ExperienceModal } from "./components/ExperienceModal";

import {
    buttonStyle,
    controlAreaStyle,
    textAreaInputStyle,
    textAreaRootStyle,
    wrapper,
} from "./page.css";

export const StreamerPage = () => {
    const {
        textareaRef,
        clientText,
        updateText,
        handler: { handleInputChange, handleReset },
    } = useStreamer();

    const {
        handler: { handleShortTypingSound },
    } = useTyping();

    const {
        experienceState,
        stageSwitcher,
        mutator: { setStage },
    } = useExperenceStates();

    const timeoutRef = useRef<number | null>(null);

    useEffect(() => {
        const clearExistingTimeout = () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
        };

        const startTextUpdate = (demoText: string) => {
            let index = 1; // Initialize index to 1 to start with the first character

            const updateWithRandomInterval = () => {
                if (index <= demoText.length) {
                    updateText(demoText.slice(0, index));
                    index++;

                    // Generate a random duration between 100 and 400 ms for the next update
                    const randomDuration = Math.floor(Math.random() * 300) + 100;

                    // Set the next timeout
                    timeoutRef.current = window.setTimeout(
                        updateWithRandomInterval,
                        randomDuration
                    );
                }
            };

            // Start the first update with an initial random interval
            updateWithRandomInterval();
        };

        if (experienceState.stage !== "finish") {
            handleReset(); // Call handleReset if stage is not "finish"
        }

        if (experienceState.stage === "demo" && experienceState.demoSelection) {
            const demoText = demoInput[experienceState.demoSelection.key];
            startTextUpdate(demoText);
        } else {
            clearExistingTimeout();
        }

        return () => {
            clearExistingTimeout();
        };
    }, [experienceState, updateText, handleReset, demoInput]);

    useEffect(() => {
        if (experienceState.stage === "demo" && experienceState.demoSelection) {
            handleShortTypingSound();
            handleInputChange(clientText);
        }
    }, [clientText, experienceState]);

    return (
        <div className={wrapper}>
            <ExperienceModal />
            <Textarea
                classNames={{ root: textAreaRootStyle, input: textAreaInputStyle }}
                value={clientText}
                onChange={(e) => {
                    handleShortTypingSound();
                    handleInputChange(e.target.value);
                }}
                placeholder="Write message"
                ref={textareaRef}
                disabled={experienceState.stage === "demo"}
            />

            <div className={controlAreaStyle}>
                {(experienceState.stage === "demo" || experienceState.stage === "diary") &&
                    stageSwitcher({
                        demo: (
                            <Button onClick={() => setStage("diary")} className={buttonStyle}>
                                {"デモを終了する"}
                            </Button>
                        ),
                        diary: (
                            <Button onClick={() => setStage("finish")} className={buttonStyle}>
                                {"体験を終了する"}
                            </Button>
                        ),
                    })}
                {experienceState.stage === "demo" && (
                    <Button onClick={() => setStage("demo")} className={buttonStyle}>
                        他のデモを見る
                    </Button>
                )}
            </div>
        </div>
    );
};
