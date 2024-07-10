import { computeIntersection, computePlaneFromTriangle, computeTriangleNormal, cylindric, IOrientedPlane, IPoint, isInPlane, isInsideVolume, ITriangle, rotateZ } from "./geometry";
import { Parameters } from "./parameters";

import "./page-interface-generated";


function logParsingInfo(message: string): void {
    if (Parameters.verbose) {
        console.log(`OBJ parsing:  ${message}`);
    }
}

const knownGemstones: {
    [name: string]: Gemstone | null; // null when requested but not loaded yet
} = {};

class Gemstone {
    public static loadGemstone(name: string, callback: (gemstone: Gemstone | null) => unknown): void {
        if (name === "CUSTOM CUT") {
            callback(Gemstone.customCut());
        } else if (typeof knownGemstones[name] !== "undefined") {
            callback(knownGemstones[name]);
        } else {
            const request = new XMLHttpRequest();
            request.addEventListener("load", () => {
                if (request.status === 200) {
                    if (typeof knownGemstones[name] === "undefined") { // maybe it was loaded in the meantime
                        knownGemstones[name] = Gemstone.fromObj(request.responseText);
                    }
                    callback(knownGemstones[name]);
                } else {
                    callback(null);
                }
            });
            request.open("GET", `models/${name}?v=${Page.version}`);
            request.send();
        }
    }

    public static fromObj(input: string): Gemstone {
        const lines = input.split("\n");

        const vertices: IPoint[] = [];
        const triangles: ITriangle[] = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            const lineItems = line.split(/\s+/);
            const command = lineItems[0];

            if (command === "v") { // declare vertex
                if (lineItems.length >= 4) {
                    vertices.push({
                        x: parseFloat(lineItems[1]),
                        y: parseFloat(lineItems[2]),
                        z: parseFloat(lineItems[3]),
                    });
                } else {
                    logParsingInfo(`Ignoring line ${i} because it does not have enough items: '${line}'.`);
                    continue;
                }
            } else if (command === "f") { // declare face
                if (lineItems.length >= 4) {
                    // faces with more that 3 vertices are interpreted as TRIANGLE_FAN
                    for (let iV = 3; iV < lineItems.length; iV++) {
                        const indices: number[] = [
                            +(lineItems[1].split("/")[0]),
                            +(lineItems[iV - 1].split("/")[0]),
                            +(lineItems[iV].split("/")[0]),
                        ];

                        for (const indice of indices) {
                            if (indice < 1 || indice >= vertices.length) {
                                logParsingInfo(`Ignoring line ${i} because vertex index ${indice} is out of range: '${line}'.`);
                                continue;
                            }
                        }

                        triangles.push({
                            p1: vertices[indices[0] - 1],
                            p2: vertices[indices[1] - 1],
                            p3: vertices[indices[2] - 1],
                        });
                    }
                } else {
                    logParsingInfo(`Ignoring line ${i} because only triangular faces are supported: '${line}'.`);
                    continue;
                }
            } else {
                logParsingInfo(`Ignoring line ${i}: '${line}'.`);
                continue;
            }
        }

        return new Gemstone(triangles);
    }

    public static customCut(): Gemstone {
        const triangles = Gemstone.computeBrilliantCut();
        return new Gemstone(triangles);
    }

    public readonly facets: IOrientedPlane[];
    public readonly bufferData: Float32Array;
    public readonly nbTriangles: number;
    public readonly isConvex: boolean;

    private constructor(triangles: ITriangle[]) {
        Gemstone.mutualizeTrianglesVertices(triangles);

        this.nbTriangles = triangles.length;
        this.bufferData = Gemstone.buildBufferFromTriangles(triangles);
        this.facets = Gemstone.buildFacetsFromTriangles(triangles);

        const vertices: IPoint[] = [];
        for (const triangle of triangles) {
            vertices.push(triangle.p1);
            vertices.push(triangle.p2);
            vertices.push(triangle.p3);
        }
        this.isConvex = Gemstone.checkConvexity(vertices, this.facets);

        if (!this.isConvex) {
            console.log("This shape is not convex :(.");
        }
    }

    // private static exportAsObj(triangles: ITriangle[]): string {
    //     const verticesDeclarations: string[] = [];
    //     const facesDeclarations: string[] = [];

    //     const verticesOrdered: IPoint[] = [];
    //     for (const triangle of triangles) {
    //         let indexOf1 = verticesOrdered.indexOf(triangle.p1);
    //         let indexOf2 = verticesOrdered.indexOf(triangle.p2);
    //         let indexOf3 = verticesOrdered.indexOf(triangle.p3);

    //         if (indexOf1 < 0) {
    //             indexOf1 = verticesOrdered.length;
    //             verticesOrdered.push(triangle.p1);
    //         }
    //         if (indexOf2 < 0) {
    //             indexOf2 = verticesOrdered.length;
    //             verticesOrdered.push(triangle.p2);
    //         }
    //         if (indexOf3 < 0) {
    //             indexOf3 = verticesOrdered.length;
    //             verticesOrdered.push(triangle.p3);
    //         }

    //         facesDeclarations.push(`f ${indexOf1 + 1} ${indexOf2 + 1} ${indexOf3 + 1}`);
    //     }

    //     for (const vertice of verticesOrdered) {
    //         verticesDeclarations.push(`v ${vertice.x} ${vertice.y} ${vertice.z}`);
    //     }

    //     return `${verticesDeclarations.join("\n")}\n\n${facesDeclarations.join("\n")}`;
    // }

    private static buildBufferFromTriangles(triangles: ITriangle[]): Float32Array {
        const nbFloatsPerTriangle = (3 + 3) * 3;
        const bufferData = new Float32Array(nbFloatsPerTriangle * triangles.length);
        let i = 0;
        for (const triangle of triangles) {
            const normal = computeTriangleNormal(triangle);

            bufferData[i++] = triangle.p1.x;
            bufferData[i++] = triangle.p1.y;
            bufferData[i++] = triangle.p1.z;
            bufferData[i++] = normal.x;
            bufferData[i++] = normal.y;
            bufferData[i++] = normal.z;
            bufferData[i++] = triangle.p2.x;
            bufferData[i++] = triangle.p2.y;
            bufferData[i++] = triangle.p2.z;
            bufferData[i++] = normal.x;
            bufferData[i++] = normal.y;
            bufferData[i++] = normal.z;
            bufferData[i++] = triangle.p3.x;
            bufferData[i++] = triangle.p3.y;
            bufferData[i++] = triangle.p3.z;
            bufferData[i++] = normal.x;
            bufferData[i++] = normal.y;
            bufferData[i++] = normal.z;
        }
        return bufferData;
    }

    private static buildFacetsFromTriangles(triangles: ITriangle[]): IOrientedPlane[] {
        const result: IOrientedPlane[] = [];
        for (const triangle of triangles) {
            let knownFacet = false;

            for (const registeredPlane of result) {
                if (isInPlane(registeredPlane, triangle.p1) && isInPlane(registeredPlane, triangle.p2) && isInPlane(registeredPlane, triangle.p3)) {
                    knownFacet = true;
                    break;
                }
            }

            if (!knownFacet) {
                result.push(computePlaneFromTriangle(triangle));
            }
        }
        return result;
    }

    private static checkConvexity(vertices: IPoint[], facets: IOrientedPlane[]): boolean {
        for (const vertice of vertices) {
            if (!isInsideVolume(facets, vertice)) {
                return false;
            }
        }
        return true;
    }

    private static computeBrilliantCut(): ITriangle[] {
        const CROWN_SIZE = 1;
        const HALF_CROWN_SIZE = 0.5 * CROWN_SIZE;
        const PAVILION_HEIGHT = Parameters.customCutPavillionHeight;
        const PAVILION_STEP = Parameters.customCutPavillionRati;
        const GIRDLE_THICKNESS = Parameters.customCutGirdleThickness;
        const GIRDLE_ROUNDNESS = Parameters.customCutGirdleRoundess;
        const CROWN_DEPTH = Parameters.customCutCrownHeight;
        const CROWN_RATIO = Parameters.customCutCrownRatio;
        const TABLE_SIZE = Parameters.customCutCrownTable;
        const CROWN_HEIGHT = GIRDLE_THICKNESS + CROWN_DEPTH;

        const vertex0: IPoint = { x: 0, y: 0, z: -PAVILION_HEIGHT };

        const vertex1: IPoint = cylindric((1 - PAVILION_STEP) * HALF_CROWN_SIZE / Math.cos(2 * Math.PI / 16), 2 * Math.PI / 8, -PAVILION_HEIGHT * PAVILION_STEP);
        const vertex2: IPoint = rotateZ(vertex1, -2 * Math.PI / 8);
        const vertex3: IPoint = cylindric(HALF_CROWN_SIZE, 2 * 2 * Math.PI / 16, 0);
        const vertex4: IPoint = cylindric(HALF_CROWN_SIZE, 1 * 2 * Math.PI / 16, 0);
        const vertex5: IPoint = cylindric(HALF_CROWN_SIZE, 0 * 2 * Math.PI / 16, 0);

        const vertex6: IPoint = { x: vertex3.x, y: vertex3.y, z: GIRDLE_THICKNESS };
        const vertex7: IPoint = { x: vertex4.x, y: vertex4.y, z: GIRDLE_THICKNESS };
        const vertex8: IPoint = { x: vertex5.x, y: vertex5.y, z: GIRDLE_THICKNESS };

        const vertex9: IPoint = cylindric(0.5 * ((1 - CROWN_RATIO) * CROWN_SIZE + CROWN_RATIO * TABLE_SIZE) / Math.cos(2 * Math.PI / 16), 2 * Math.PI / 8, GIRDLE_THICKNESS + CROWN_RATIO * CROWN_DEPTH);
        const vertex10: IPoint = rotateZ(vertex9, -2 * Math.PI / 8);
        const vertex11: IPoint = cylindric(0.5 * TABLE_SIZE, 1 * 2 * Math.PI / 16, CROWN_HEIGHT);
        const vertex12: IPoint = cylindric(0.5 * TABLE_SIZE, -1 * 2 * Math.PI / 16, CROWN_HEIGHT);
        const vertex13: IPoint = { x: 0, y: 0, z: CROWN_HEIGHT };

        const lowerFacet1 = computePlaneFromTriangle({ p1: vertex2, p3: vertex5, p2: vertex4 });
        const lowerFacet2 = computePlaneFromTriangle({ p1: vertex1, p3: vertex4, p2: vertex3 });

        const higherFacet1 = computePlaneFromTriangle({ p1: vertex7, p3: vertex8, p2: vertex10 });
        const higherFacet2 = computePlaneFromTriangle({ p1: vertex6, p3: vertex7, p2: vertex9 });

        // compute one eighth
        const triangles: ITriangle[] = [];

        for (let iSide = 0; iSide < 2; iSide++) {
            const lowerFacet = (iSide === 0) ? lowerFacet1 : lowerFacet2;
            const higherFacet = (iSide === 0) ? higherFacet1 : higherFacet2;
            const lowerBaseVertex = (iSide === 0) ? vertex2 : vertex1;
            const upperBaseVertex = (iSide === 0) ? vertex10 : vertex9;

            const nbPoints = GIRDLE_ROUNDNESS + 2;
            const deltaAngle = 2 * Math.PI / 16 / (nbPoints - 1);
            const sideBaseAngle = iSide * 2 * Math.PI / 16;
            for (let iP = 0; iP < nbPoints - 1; iP++) {
                const angle = sideBaseAngle + iP * deltaAngle;

                const lowerN = computeIntersection(cylindric(HALF_CROWN_SIZE, angle, 0), { x: 0, y: 0, z: 1 }, lowerFacet);
                const lowerNplus = computeIntersection(cylindric(HALF_CROWN_SIZE, angle + deltaAngle, 0), { x: 0, y: 0, z: 1 }, lowerFacet);

                const upperN = computeIntersection(cylindric(HALF_CROWN_SIZE, angle, 0), { x: 0, y: 0, z: 1 }, higherFacet);
                const upperNplus = computeIntersection(cylindric(HALF_CROWN_SIZE, angle + deltaAngle, 0), { x: 0, y: 0, z: 1 }, higherFacet);

                triangles.push({ p1: lowerBaseVertex, p3: lowerN, p2: lowerNplus });
                triangles.push({ p1: lowerNplus, p3: lowerN, p2: upperN });
                triangles.push({ p1: lowerNplus, p3: upperN, p2: upperNplus });
                triangles.push({ p1: upperBaseVertex, p3: upperNplus, p2: upperN });
            }
        }


        // PAVILION
        triangles.push({ p1: vertex0, p3: vertex2, p2: vertex4 });
        triangles.push({ p1: vertex0, p3: vertex4, p2: vertex1 });

        // CROWN
        triangles.push({ p1: vertex11, p3: vertex12, p2: vertex13 });
        triangles.push({ p1: vertex11, p3: vertex10, p2: vertex12 });
        triangles.push({ p1: vertex7, p3: vertex10, p2: vertex11 });
        triangles.push({ p1: vertex7, p3: vertex11, p2: vertex9 });

        // apply symetry
        const nbTrianglesForOneEighth = triangles.length;
        for (let i = 1; i < 8; i++) {
            for (let iT = 0; iT < nbTrianglesForOneEighth; iT++) {
                triangles.push({
                    p1: rotateZ(triangles[iT].p1, i * 2 * Math.PI / 8),
                    p2: rotateZ(triangles[iT].p2, i * 2 * Math.PI / 8),
                    p3: rotateZ(triangles[iT].p3, i * 2 * Math.PI / 8),
                });
            }
        }

        return triangles;
    }

    private static mutualizeTrianglesVertices(triangles: ITriangle[]): void {
        let nbPointsSaved = 0;

        const knownVerticesStore: { [hash: string]: IPoint } = {};

        const precision = Math.pow(10, 8);
        function round(x: number): number {
            return Math.round(precision * x);
        }

        function getSimilarVerticeFromStore(point: IPoint): IPoint {
            const hash = `${round(point.x)}_${round(point.y)}_${round(point.z)}`;
            if (typeof knownVerticesStore[hash] === "undefined") {
                knownVerticesStore[hash] = point;
            } else {
                nbPointsSaved++;
            }
            return knownVerticesStore[hash];
        }

        for (const triangle of triangles) {
            triangle.p1 = getSimilarVerticeFromStore(triangle.p1);
            triangle.p2 = getSimilarVerticeFromStore(triangle.p2);
            triangle.p3 = getSimilarVerticeFromStore(triangle.p3);
        }

        logParsingInfo(`After mutualization: ${Object.keys(knownVerticesStore).length} vertices (saved ${nbPointsSaved} vertices).`);
    }
}

export { Gemstone };
