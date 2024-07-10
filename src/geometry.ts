interface IPoint {
    x: number;
    y: number;
    z: number;
}

interface IVector {
    x: number;
    y: number;
    z: number;
}

interface IOrientedPlane {
    point: IPoint;
    normal: IVector;
}

interface ITriangle {
    p1: IPoint;
    p2: IPoint;
    p3: IPoint;
}

function computeTriangleNormal(triangle: ITriangle): IVector {
    const v12 = substraction(triangle.p2, triangle.p1);
    const v13 = substraction(triangle.p3, triangle.p1);
    const normal = crossProduct(v12, v13);
    normalize(normal);
    return normal;
}

function dotProduct(v1: IVector, v2: IVector): number {
    return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
}

function crossProduct(v1: IVector, v2: IVector): IVector {
    return {
        x: v1.y * v2.z - v1.z * v2.y,
        y: v1.z * v2.x - v1.x * v2.z,
        z: v1.x * v2.y - v1.y * v2.x,
    };
}

function substraction(v1: IPoint, v2: IPoint): IVector {
    return {
        x: v1.x - v2.x,
        y: v1.y - v2.y,
        z: v1.z - v2.z,
    };
}

function normalize(v: IVector): void {
    const length = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
    if (length > 0) {
        v.x /= length;
        v.y /= length;
        v.z /= length;
    } else {
        v.x = 1;
        v.y = 0;
        v.z = 0;
    }
}

function averagePoint(...points: IPoint[]): IPoint {
    const result: IPoint = { x: 0, y: 0, z: 0 };
    for (const point of points) {
        result.x += point.x;
        result.y += point.y;
        result.z += point.z;
    }
    const nbPoints = points.length;
    result.x /= nbPoints;
    result.y /= nbPoints;
    result.z /= nbPoints;
    return result;
}

function isInPlane(plane: IOrientedPlane, point: IPoint): boolean {
    const localCoords = substraction(point, plane.point);
    return Math.abs(dotProduct(plane.normal, localCoords)) < 0.001;
}

function isInsideVolume(planes: IOrientedPlane[], point: IPoint): boolean {
    for (const plane of planes) {
        const localCoords = substraction(point, plane.point);
        if (dotProduct(plane.normal, localCoords) > 0.001) {
            return false;
        }
    }
    return true;
}

function rotateZ(point: IPoint, angle: number): IPoint {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
        x: cos * point.x - sin * point.y,
        y: sin * point.x + cos * point.y,
        z: point.z,
    };
}

function cylindric(radius: number, angle: number, z: number): IPoint {
    return {
        x: radius * Math.cos(angle),
        y: radius * Math.sin(angle),
        z,
    };
}

function computeIntersection(point: IPoint, direction: IVector, plane: IOrientedPlane): IPoint {
    const b = dotProduct(direction, plane.normal);
    if (b !== 0) {
        const a = dotProduct(substraction(plane.point, point), plane.normal);
        const theta = a / b;
        return {
            x: point.x + theta * direction.x,
            y: point.y + theta * direction.y,
            z: point.z + theta * direction.z,
        };
    } else {
        return point;
    }
}

function computePlaneFromTriangle(triangle: ITriangle): IOrientedPlane {
    return {
        point: averagePoint(triangle.p1, triangle.p2, triangle.p3),
        normal: computeTriangleNormal(triangle),
    };
}

export {
    averagePoint,
    computeIntersection,
    computePlaneFromTriangle,
    computeTriangleNormal,
    cylindric,
    isInPlane,
    isInsideVolume,
    rotateZ,
    IOrientedPlane,
    IPoint,
    IVector,
    ITriangle,
};
