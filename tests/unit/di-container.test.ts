/**
 * DI Container Tests
 * Tests for lego/core/di-container.ts
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { getContainer, createContainer, resetContainer, DIContainer } from '@core/di-container.js';

describe('DI Container', () => {
  beforeEach(() => {
    resetContainer();
  });

  it('should create container instance', () => {
    const container = createContainer();
    expect(container).toBeInstanceOf(DIContainer);
  });

  it('should register and resolve service', () => {
    const container = createContainer();
    const serviceId = 'TestService';
    
    container.register(serviceId, () => ({ value: 'test' }), false);
    
    const service = container.resolve(serviceId);
    expect(service).toEqual({ value: 'test' });
  });

  it('should create singleton service', () => {
    const container = createContainer();
    const serviceId = 'SingletonService';
    let callCount = 0;
    
    container.register(serviceId, () => {
      callCount++;
      return { value: 'singleton', count: callCount };
    }, true);
    
    const service1 = container.resolve(serviceId);
    const service2 = container.resolve(serviceId);
    
    expect(service1).toBe(service2);
    expect(callCount).toBe(1);
  });

  it('should create new instance for non-singleton', () => {
    const container = createContainer();
    const serviceId = 'NonSingletonService';
    let callCount = 0;
    
    container.register(serviceId, () => {
      callCount++;
      return { value: 'instance', count: callCount };
    }, false);
    
    const service1 = container.resolve(serviceId);
    const service2 = container.resolve(serviceId);
    
    expect(service1).not.toBe(service2);
    expect(callCount).toBe(2);
  });

  it('should throw error for unregistered service', () => {
    const container = createContainer();
    
    expect(() => container.resolve('UnregisteredService')).toThrow('Service not registered');
  });

  it('should check if service is registered', () => {
    const container = createContainer();
    const serviceId = 'TestService';
    
    expect(container.has(serviceId)).toBe(false);
    
    container.register(serviceId, () => ({}), false);
    
    expect(container.has(serviceId)).toBe(true);
  });

  it('should clear all services', () => {
    const container = createContainer();
    const serviceId = 'TestService';
    
    container.register(serviceId, () => ({}), false);
    expect(container.has(serviceId)).toBe(true);
    
    container.clear();
    expect(container.has(serviceId)).toBe(false);
  });

  it('should get global container', () => {
    const container1 = getContainer();
    const container2 = getContainer();
    
    expect(container1).toBe(container2);
  });

  it('should reset global container', () => {
    const container1 = getContainer();
    resetContainer();
    const container2 = getContainer();
    
    expect(container1).not.toBe(container2);
  });

  it('should pass container to factory', () => {
    const container = createContainer();
    const serviceId = 'ServiceWithDependency';
    const dependencyId = 'Dependency';
    
    container.register(dependencyId, () => ({ dep: 'value' }), false);
    container.register(serviceId, (c) => {
      const dep = c.resolve(dependencyId);
      return { service: 'value', dependency: dep };
    }, false);
    
    const service = container.resolve(serviceId);
    expect(service).toEqual({
      service: 'value',
      dependency: { dep: 'value' },
    });
  });

  it('should support symbol identifiers', () => {
    const container = createContainer();
    const serviceId = Symbol('TestService');
    
    container.register(serviceId, () => ({ value: 'test' }), false);
    
    const service = container.resolve(serviceId);
    expect(service).toEqual({ value: 'test' });
  });
});

