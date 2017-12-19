/*
 * Copyright 2015-2017 WorldWind Contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * @exports TextRenderer
 */
define([
        '../error/ArgumentError',
        '../shaders/BasicTextureProgram',
        '../util/Color',
        '../util/Font',
        '../util/Logger',
        '../geom/Matrix',
        '../render/Texture',
        '../geom/Vec2'
    ],
    function (ArgumentError,
              BasicTextureProgram,
              Color,
              Logger,
              Matrix,
              Texture,
              Vec2) {
        "use strict";

        /**
         * Constructs a TextRenderer instance.
         * @alias TextRenderer
         * @constructor
         * @classdesc Provides methods useful for displaying text. An instance of this class is attached to the
         * WorldWindow {@link DrawContext} and is not intended to be used independently of that. Applications typically do
         * not create instances of this class.
         */
        var TextRenderer = function () {

            // Internal use only. Intentionally not documented.
            this._canvas2D = document.createElement("canvas");

            // Internal use only. Intentionally not documented.
            this._ctx2D = this._canvas2D.getContext("2d");

            // Internal use only. Intentionally not documented.
            this._lineSpacing = 0.15; // fraction of font size

            // Internal use only. Intentionally not documented.
            this._textSize = this._ctx2D.font.size;

            // Internal use only. Intentionally not documented.
            this._font = this._ctx2D.font;

            // Internal use only. Intentionally not documented.
            this._outlineEnabled = true;

            // Internal use only. Intentionally not documented.
            this._outlineWidth = 4;
        };

        Object.defineProperties(TextRenderer.prototype, {
            textSize: {
                get: function () {
                    return this._textSize;
                },
                set: function (value) {
                    this._textSize = this.textSize();
                }
            },

            font: {
                get: function () {
                    return this._font;
                },
                set: function (value) {
                    // TODO: Should this be equivalent to WWA typeface?
                    this._font = new Font(value);
                }
            },

            outlineEnabled: {
                get: function () {
                    return this._outlineEnabled;
                },
                set: function (value) {
                    this._outlineEnabled = value;
                }
            },

            outlineWidth: {
                get: function () {
                    return this._outlineWidth;
                },
                set: function (value) {
                    this._outlineWidth = value;
                }
            }
        });

        /**
         * Returns the width and height of a specified text string upon applying a specified font and optional outline.
         * @param {string} text The text string.
         * @param {Font} font The font to apply when drawing the text.
         * @param {Boolean} outline Indicates whether the text includes an outline, which increases its width and height.
         * @returns {Vec2} A vector indicating the text's width and height, respectively, in pixels.
         */
        TextRenderer.prototype.textSize = function (text, font) {
            if (text.length === 0) {
                return new Vec2(0, 0);
            }

            this.ctx2D.font = font.fontString;

            var lines = text.split("\n"),
                height = lines.length * (font.size * (1 + this.lineSpacing)),
                maxWidth = 0;

            for (var i = 0; i < lines.length; i++) {
                maxWidth = Math.max(maxWidth, this.ctx2D.measureText(lines[i]).width);
            }

            if (this._outlineEnabled) {
                maxWidth += this.strokeWidth;
                height += this.strokeWidth;
            }

            return new Vec2(maxWidth, height);
        };

        TextRenderer.prototype.renderText = function (dc, text) {
            var gl = dc.currentGlContext,
                ctx2D = this._ctx2D,
                canvas2D = this._canvas2D,
                textSize = this.textSize(text, this.font, this.this._outlineEnabled),
                lines = text.split("\n"),
                strokeOffset = this._outlineEnabled ? this._outlineWidth / 2 : 0,
                pixelScale = dc.pixelScale;

            canvas2D.width = Math.ceil(textSize[0]) * pixelScale;
            canvas2D.height = Math.ceil(textSize[1]) * pixelScale;

            ctx2D.scale(pixelScale, pixelScale);
            ctx2D.font = font.fontString;
            ctx2D.textBaseline = "top";
            ctx2D.textAlign = font.horizontalAlignment;
            ctx2D.fillStyle = Color.WHITE.toHexString(false);
            ctx2D.strokeStyle = this.strokeStyle;
            ctx2D.lineWidth = this._outlineWidth;
            ctx2D.lineCap = "round";
            ctx2D.lineJoin = "round";

            if (font.horizontalAlignment === "left") {
                ctx2D.translate(strokeOffset, 0);
            } else if (font.horizontalAlignment === "right") {
                ctx2D.translate(textSize[0] - strokeOffset, 0);
            } else {
                ctx2D.translate(textSize[0] / 2, 0);
            }

            for (var i = 0; i < lines.length; i++) {
                if (this._outlineEnabled) {
                    ctx2D.strokeText(lines[i], 0, 0);
                }
                ctx2D.fillText(lines[i], 0, 0);
                ctx2D.translate(0, font.size * (1 + this.lineSpacing) + strokeOffset);
            }

            return new Texture(gl, canvas2D);
        };

        /**
         * Calculates maximum line height based on a font
         * @param {Font} font The font to use.
         * @returns {Vec2} A vector indicating the text's width and height, respectively, in pixels based on the passed font.
         */
        TextRenderer.prototype.getMaxLineHeight = function(font)
        {
            // Check underscore + capital E with acute accent
            return this.textSize("_\u00c9", font, 0)[1];
        };

        TextRenderer.prototype.wrap = function(text, width, height, font)
        {
            if (!text) {
                throw new ArgumentError(
                    Logger.logMessage(Logger.WARNING, "TextSupport", "wrap", "missing text"));
            }

            var i;

            var lines = text.split("\n");
            var wrappedText = "";

            // Wrap each line
            for (i = 0; i < lines.length; i++)
            {
                lines[i] = this.wrapLine(lines[i], width, font);
            }
            // Concatenate all lines in one string with new line separators
            // between lines - not at the end
            // Checks for height limit.
            var currentHeight = 0;
            var heightExceeded = false;
            var maxLineHeight = this.getMaxLineHeight(font);
            for (i = 0; i < lines.length && !heightExceeded; i++)
            {
                var subLines = lines[i].split("\n");
                for (var j = 0; j < subLines.length && !heightExceeded; j++)
                {
                    if (height <= 0 || currentHeight + maxLineHeight <= height)
                    {
                        wrappedText += subLines[j];
                        currentHeight += maxLineHeight + this.lineSpacing;
                        if (j < subLines.length - 1) {
                            wrappedText += '\n';
                        }
                    }
                    else
                    {
                        heightExceeded = true;
                    }
                }

                if (i < lines.length - 1 && !heightExceeded) {
                    wrappedText += '\n';
                }
            }
            // Add continuation string if text truncated
            if (heightExceeded)
            {
                if (wrappedText.length > 0) {
                    wrappedText = wrappedText.substring(0, wrappedText.length - 1);
                }

                wrappedText += "...";
            }

            return wrappedText;
        };

        /**
         * Wraps a line of text based on width and height
         * @param {String} text The text to wrap.
         * @param {Number} width The width in pixels.
         * @param {Font} font The font to use.
         * @returns {String} The wrapped text.
         */
        TextRenderer.prototype.wrapLine = function(text, width, font)
        {
            var wrappedText = "";

            // Single line - trim leading and trailing spaces
            var source = text.trim();
            var lineBounds = this.textSize(source, font, 0);
            if (lineBounds[0] > width)
            {
                // Split single line to fit preferred width
                var line = "";
                var start = 0;
                var end = source.indexOf(' ', start + 1);
                while (start < source.length)
                {
                    if (end == -1) {
                        end = source.length;   // last word
                    }

                    // Extract a 'word' which is in fact a space and a word
                    var word = source.substring(start, end);
                    var linePlusWord = line + word;
                    if (this.textSize(linePlusWord, font, 0)[0] <= width)
                    {
                        // Keep adding to the current line
                        line += word;
                    }
                    else
                    {
                        // Width exceeded
                        if (line.length != 0)
                        {
                            // Finish current line and start new one
                            wrappedText += line;
                            wrappedText += '\n';
                            line = "";
                            line += word.trim();  // get read of leading space(s)
                        }
                        else
                        {
                            // Line is empty, force at least one word
                            line += word.trim();
                        }
                    }
                    // Move forward in source string
                    start = end;
                    if (start < source.length - 1)
                    {
                        end = source.indexOf(' ', start + 1);
                    }
                }
                // Gather last line
                wrappedText += line;
            }
            else
            {
                // Line doesn't need to be wrapped
                wrappedText += source;
            }

            return wrappedText;
        };

        return TextRenderer;
    });