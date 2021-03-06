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
define([
    'src/formats/kml/util/ItemIcon',
    'src/util/XmlDocument'
], function (
    ItemIcon,
    XmlDocument
) {
    "use strict";
    describe("ItemIconTest", function () {
            var validKml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>" +
                "<kml xmlns=\"http://www.opengis.net/kml/2.2\">" +
                "<ItemIcon>" +
                "   <state>open</state>" +
                "   <href>validUrl</href>" +
                "</ItemIcon>" +
                "</kml>";
            var kmlRepresentation = new XmlDocument(validKml).dom();
            var scale = new ItemIcon({objectNode:
                kmlRepresentation.getElementsByTagName("ItemIcon")[0]});
        it ('should have the State and Href properties', function(){
            expect(scale.kmlState).toEqual("open");
            expect(scale.kmlHref).toEqual("validUrl");
        });


        });
    });
